import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LostPet } from './lost-pet.entity';
import { CreateLostPetDto } from './dto/create-lost-pet.dto';
import { REDIS_CLIENT } from '../redis/redis.module';
import type { RedisClientType } from 'redis';

export type LostPetMatch = {
  pet: LostPet;
  distance_meters: number;
};

const CACHE_KEY_LOST_PETS = 'lost_pets:active';
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class LostPetsService {
  private readonly logger = new Logger(LostPetsService.name);

  constructor(
    @InjectRepository(LostPet)
    private readonly lostPetsRepo: Repository<LostPet>,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  async create(dto: CreateLostPetDto): Promise<LostPet> {
    const entity = this.lostPetsRepo.create({
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      color: dto.color,
      size: dto.size,
      description: dto.description,
      photo_url: dto.photo_url ?? null,
      owner_name: dto.owner_name,
      owner_email: dto.owner_email,
      owner_phone: dto.owner_phone,
      location: { type: 'Point', coordinates: [dto.lng, dto.lat] },
      address: dto.address,
      lost_date: new Date(dto.lost_date),
      is_active: dto.is_active ?? true,
    });

    const saved = await this.lostPetsRepo.save(entity);
    // Invalidate cache on write
    await this.redis.del(CACHE_KEY_LOST_PETS);
    return saved;
  }

  async findActive(): Promise<LostPet[]> {
    try {
      const cached = await this.redis.get(CACHE_KEY_LOST_PETS);
      if (cached) {
        this.logger.debug('Cache HIT: lost_pets:active');
        return JSON.parse(cached) as LostPet[];
      }
    } catch (err) {
      this.logger.warn('Redis GET failed, falling through to DB', err);
    }

    this.logger.debug('Cache MISS: lost_pets:active — querying DB');
    const pets = await this.lostPetsRepo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });

    try {
      await this.redis.set(CACHE_KEY_LOST_PETS, JSON.stringify(pets), {
        EX: CACHE_TTL_SECONDS,
      });
    } catch (err) {
      this.logger.warn('Redis SET failed', err);
    }

    return pets;
  }

  async findActiveWithinRadius(params: {
    lng: number;
    lat: number;
    radiusMeters: number;
  }): Promise<LostPetMatch[]> {
    const qb = this.lostPetsRepo
      .createQueryBuilder('lost')
      .where('lost.is_active = true')
      .andWhere(
        `ST_DWithin(
          lost.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
      )
      .addSelect(
        `ST_Distance(
          lost.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )`,
        'distance',
      )
      .setParameters({
        lng: params.lng,
        lat: params.lat,
        radius: params.radiusMeters,
      })
      .orderBy('distance', 'ASC');

    const { entities, raw } = await qb.getRawAndEntities();
    return entities.map((pet, idx) => ({
      pet,
      distance_meters: Number(raw[idx]?.distance ?? NaN),
    }));
  }
}
