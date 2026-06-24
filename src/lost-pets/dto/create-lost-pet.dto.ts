import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateLostPetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  species!: string;

  @IsString()
  @IsNotEmpty()
  breed!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  photo_url?: string | null;

  @IsString()
  @IsNotEmpty()
  owner_name!: string;

  @IsEmail()
  owner_email!: string;

  @IsString()
  @IsNotEmpty()
  owner_phone!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsDateString()
  lost_date!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

