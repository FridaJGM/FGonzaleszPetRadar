import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'found_pets' })
export class FoundPet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  species!: string;

  @Column({ type: 'varchar', nullable: true })
  breed!: string | null;

  @Column({ type: 'varchar' })
  color!: string;

  @Column({ type: 'varchar' })
  size!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url!: string | null;

  @Column({ type: 'varchar' })
  finder_name!: string;

  @Column({ type: 'varchar' })
  finder_email!: string;

  @Column({ type: 'varchar' })
  finder_phone!: string;

  @Column({ type: 'float' })
  lat!: number;

  @Column({ type: 'float' })
  lng!: number;

  @Column({ type: 'varchar' })
  address!: string;

  @Column({ type: 'timestamptz' })
  found_date!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
