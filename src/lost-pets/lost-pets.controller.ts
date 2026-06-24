import { Body, Controller, Get, Post } from '@nestjs/common';
import { LostPetsService } from './lost-pets.service';
import { CreateLostPetDto } from './dto/create-lost-pet.dto';
import { LostPet } from './lost-pet.entity';

@Controller('lost-pets')
export class LostPetsController {
  constructor(private readonly lostPetsService: LostPetsService) {}

  @Post()
  async create(@Body() dto: CreateLostPetDto): Promise<LostPet> {
    return await this.lostPetsService.create(dto);
  }

  @Get()
  async findAll(): Promise<LostPet[]> {
    return await this.lostPetsService.findActive();
  }
}
