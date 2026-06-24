import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { FoundPetsService } from './found-pets.service';
import { FoundPet } from './found-pet.entity';

@Controller('found-pets')
export class FoundPetsController {
  constructor(private readonly foundPetsService: FoundPetsService) {}

  @Post()
  async create(@Body() dto: CreateFoundPetDto) {
    return await this.foundPetsService.create(dto);
  }

  @Get()
  async findAll(): Promise<FoundPet[]> {
    return await this.foundPetsService.findAll();
  }
}
