import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoundPet } from './found-pet.entity';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { LostPetsService } from '../lost-pets/lost-pets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import type { RedisClientType } from 'redis';

const CACHE_KEY_FOUND_PETS = 'found_pets:all';
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class FoundPetsService {
  private readonly logger = new Logger(FoundPetsService.name);

  constructor(
    @InjectRepository(FoundPet)
    private readonly foundPetsRepo: Repository<FoundPet>,
    private readonly lostPetsService: LostPetsService,
    private readonly notificationsService: NotificationsService,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  async create(dto: CreateFoundPetDto): Promise<{
    foundPet: FoundPet;
    matches_notified: number;
  }> {
    const foundPet = await this.foundPetsRepo.save(
      this.foundPetsRepo.create({
        species: dto.species,
        breed: dto.breed ?? null,
        color: dto.color,
        size: dto.size,
        description: dto.description,
        photo_url: dto.photo_url ?? null,
        finder_name: dto.finder_name,
        finder_email: dto.finder_email,
        finder_phone: dto.finder_phone,
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
        found_date: new Date(dto.found_date),
      }),
    );

    await this.redis.del(CACHE_KEY_FOUND_PETS);

    const matches = await this.lostPetsService.findActiveWithinRadius({
      lng: dto.lng,
      lat: dto.lat,
      radiusMeters: 500,
    });

    let matches_notified = 0;
    for (const match of matches) {
      const result = await this.notificationsService.notifyLostPetOwner({
        lostPet: match.pet,
        foundPet,
        distanceMeters: match.distance_meters,
      });
      if (result.sent) matches_notified += 1;
    }

    return { foundPet, matches_notified };
  }

  async findAll(): Promise<FoundPet[]> {
    try {
      const cached = await this.redis.get(CACHE_KEY_FOUND_PETS);
      if (cached) {
        this.logger.debug('Cache HIT: found_pets:all');
        return JSON.parse(cached) as FoundPet[];
      }
    } catch (err) {
      this.logger.warn('Redis GET failed, falling through to DB', err);
    }

    this.logger.debug('Cache MISS: found_pets:all — querying DB');
    const pets = await this.foundPetsRepo.find({
      order: { created_at: 'DESC' },
    });

    try {
      await this.redis.set(CACHE_KEY_FOUND_PETS, JSON.stringify(pets), {
        EX: CACHE_TTL_SECONDS,
      });
    } catch (err) {
      this.logger.warn('Redis SET failed', err);
    }

    return pets;
  }
}
