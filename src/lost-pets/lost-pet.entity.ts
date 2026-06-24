import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'lost_pets' })
export class LostPet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  species!: string;

  @Column({ type: 'varchar' })
  breed!: string;

  @Column({ type: 'varchar' })
  color!: string;

  @Column({ type: 'varchar' })
  size!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url!: string | null;

  @Column({ type: 'varchar' })
  owner_name!: string;

  @Column({ type: 'varchar' })
  owner_email!: string;

  @Column({ type: 'varchar' })
  owner_phone!: string;

  @Column({ type: 'float' })
  lat!: number;

  @Column({ type: 'float' })
  lng!: number;

  @Column({ type: 'varchar' })
  address!: string;

  @Column({ type: 'timestamptz' })
  lost_date!: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
