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

// Haversine formula — replaces ST_DWithin (PostGIS not available on Railway)
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
      lat: dto.lat,
      lng: dto.lng,
      address: dto.address,
      lost_date: new Date(dto.lost_date),
      is_active: dto.is_active ?? true,
    });

    const saved = await this.lostPetsRepo.save(entity);
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
    const active = await this.findActive();
    return active
      .map((pet) => ({
        pet,
        distance_meters: haversineMeters(params.lat, params.lng, pet.lat, pet.lng),
      }))
      .filter((m) => m.distance_meters <= params.radiusMeters)
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }
}
