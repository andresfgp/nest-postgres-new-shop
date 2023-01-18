// relacion entre tablas bases de datos y nuestra app de nest

import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  email: string;

  @Column('text', {
    select: false,
  })
  password: string;

  @Column('text')
  fullName: string;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('text', {
    array: true,
    default: ['user'],
  })
  roles: string[];

  @Column('bool', {
    default: true,
  })
  isActive: boolean;

  // Before Insert
  @BeforeInsert()
  fullNameInsert() {
    this.fullName = ` ${this.firstName} ${this.lastName}`;
  }

  @BeforeInsert()
  checkFieldBeforeInsert() {
    this.email = this.email.toLocaleLowerCase().trim();
  }

  @BeforeInsert()
  checkFieldBeforeUpdate() {
    this.checkFieldBeforeInsert();
  }
}
