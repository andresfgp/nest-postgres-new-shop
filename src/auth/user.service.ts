import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { DataSource, Repository } from 'typeorm';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { User } from './entities/user.entity';
  import { validate as isUUID } from 'uuid';
  
  @Injectable()
  export class UserService {
    private readonly logger = new Logger('UserService');
  
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      private readonly dataSource: DataSource,
    ) {}
  
    async findAll(paginationDto) {
      const { limit = 10, offset = 0 } = paginationDto;
      const users = await this.userRepository.find({
        take: limit,
        skip: offset,
      });
      return users;
    }
  
    async findOne(term: string) {
      let user: User;
  
      if (isUUID(term)) {
        user = await this.userRepository.findOneBy({ id: term });
      } 
      if (!user)
        throw new NotFoundException(`User with value ${term}, not found`);
  
      return user;
    }
  
    async findOnePlain(term: string) {
      const user = await this.findOne(term);
      return user;
    }
  
    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.userRepository.preload({ id, ...updateUserDto });
        if (!user)
            throw new NotFoundException(`User with id: ${id} not found`);
        // Create query runner
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {  
            await this.userRepository.save(user);
            await queryRunner.commitTransaction();
            await queryRunner.release();
    
            return this.findOnePlain(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            this.handleDBExceptions(error);
      }
    }
  
    async remove(id: string) {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
    }
  
    async deleteAllUsers() {
      const query = this.userRepository.createQueryBuilder('user');
      try {
        return await query.delete().where({}).execute();
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  
    private handleDBExceptions(error: any) {
      if (error.code === '23505') throw new BadRequestException(error.detail);
  
      this.logger.error(error);
      throw new InternalServerErrorException('Help');
    }
  }