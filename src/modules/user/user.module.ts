import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../database/entities/user.entity';
import { PasswordModule } from '../../services/password/password.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PasswordModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
