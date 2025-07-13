import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserPagedResponse,
  UserResponse,
} from './user.dto';
import { PasswordService } from '../../services/password/password.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(page: number, limit: number): Promise<UserPagedResponse> {
    const [users, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.toPagedResponse(users, total, page, limit);
  }

  async findByUsername(username: string): Promise<UserResponse> {
    const user = await this.repository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async create(user: CreateUserRequest): Promise<UserResponse> {
    await this.validateUniqueFields({
      email: user.email,
      username: user.username,
    });

    const hashedPassword = await this.passwordService.hash(user.password);

    const newUser = await this.repository.save({
      ...user,
      password: hashedPassword,
    });

    return this.toResponse(newUser);
  }

  async update(username: string, user: UpdateUserRequest) {
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

    return this.toResponse(updatedUser);
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

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      locale: user.locale,
      timezone: user.timezone,
      defaultCurrency: user.defaultCurrency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toPagedResponse(
    users: User[],
    total: number,
    page: number,
    limit: number,
  ): UserPagedResponse {
    return {
      success: true,
      data: users.map((user) => this.toResponse(user)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  private async validateUniqueFields({
    email,
    username,
  }: {
    email?: string;
    username?: string;
  }): Promise<void> {
    const existingUser = await this.repository.findOne({
      where: [{ email }, { username }],
    });

    const duplicateFields: string[] = [];

    if (existingUser) {
      if (existingUser.email === email) {
        duplicateFields.push('email');
      }

      if (existingUser.username === username) {
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
