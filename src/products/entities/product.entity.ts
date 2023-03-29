import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/auth/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
    example: '31c7a8de-dade-4c3d-9125-ffd377edc853',
    uniqueItems: true,
    description: 'Product UUID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Pants',
    uniqueItems: true,
    description: 'Product Title',
  })
  @Column('text', {
    unique: true,
  })
  title: string;

  @ApiProperty({
    example: ['S', 'L'],
    description: 'Product Sizes',
  })
  @Column('text', {
    array: true,
  })
  sizes: string[];

  @ApiProperty({
    example: 'men',
    description: 'Product Gender',
  })
  @Column('text')
  gender: string;

  @ApiProperty({
    example: 'Pants color blue',
    description: 'Product Description',
    default: null,
  })
  @Column('text', {
    nullable: true,
  })
  description: string;

  @ApiProperty({
    example: 200.5,
    description: 'Product Price',
    default: 0,
  })
  @Column('float', {
    default: 0,
  })
  price: number;

  @ApiProperty({
    example: 'pants',
    uniqueItems: true,
    description: 'Product Slug',
  })
  @Column('text', {
    unique: true,
  })
  slug: string;

  @ApiProperty({
    example: 20,
    description: 'Product Stock',
    default: 0,
  })
  @Column('int', {
    default: 0,
  })
  stock: number;

  @ApiProperty({
    example: [],
    description: 'Product Tags',
  })
  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[];

  @ApiProperty({
    example: ['http://image1.jgp'],
    description: 'Product Images',
  })
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  // Before Insert
  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) this.slug = this.title;
    this.slug = this.slug.toLowerCase().replace(/ /g, '_').replace(/'/g, '');
  }

  // Before Update
  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug.toLowerCase().replace(/ /g, '_').replace(/'/g, '');
  }
}
