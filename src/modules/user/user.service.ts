import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserRequest, UpdateUserInternalRequest } from './user.dto';
import { PasswordService } from '../../services/password/password.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(page: number, limit: number) {
    const [users, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total };
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByVerificationToken(token: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(user: CreateUserRequest): Promise<User> {
    await this.validateUniqueFields({
      email: user.email,
      username: user.username,
    });

    const hashedPassword = await this.passwordService.hash(user.password);

    const newUser = await this.repository.save({
      ...user,
      password: hashedPassword,
    });

    return newUser;
  }

  async update(
    username: string,
    user: UpdateUserInternalRequest,
  ): Promise<User> {
    const existingUser = await this.repository.findOne({
      where: { username },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.validateUniqueFields({
      email: user.email,
      username: user.username,
    });

    if (user.password) {
      const hashedPassword = await this.passwordService.hash(user.password);
      user.password = hashedPassword;
    }

    const updatedUser = await this.repository.save({
      ...existingUser,
      ...user,
    });

    return updatedUser;
  }

  async delete(username: string) {
    const existingUser = await this.repository.findOne({
      where: { username },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.repository.delete(existingUser.id);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  private async validateUniqueFields({
    email,
    username,
  }: {
    email?: string;
    username?: string;
  }): Promise<void> {
    // Não faz validação se nenhum campo foi fornecido
    if (!email && !username) {
      return;
    }

    // Constrói as condições de busca dinamicamente
    const whereConditions: any[] = [];
    if (email) {
      whereConditions.push({ email });
    }
    if (username) {
      whereConditions.push({ username });
    }

    const existingUser = await this.repository.findOne({
      where: whereConditions,
    });

    const duplicateFields: string[] = [];

    if (existingUser) {
      if (email && existingUser.email === email) {
        duplicateFields.push('email');
      }

      if (username && existingUser.username === username) {
        duplicateFields.push('username');
      }
    }

    if (duplicateFields.length > 0) {
      throw new BadRequestException(
        `${duplicateFields.join(' and ')} already in use`,
      );
    }
  }
}
