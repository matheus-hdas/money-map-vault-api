import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserRequest, UserPagedResponse, UserResponse } from './user.dto';
import { User } from '../database/entities/user.entity';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const { users, total } = await this.userService.findAll(page, limit);
    return this.toPagedResponse(users, total, page, limit);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const userFound = await this.userService.findByUsername(username);
    return this.toResponse(userFound);
  }

  @Patch(':username')
  async update(
    @Param('username') username: string,
    @Body() user: UpdateUserRequest,
  ) {
    const updatedUser = await this.userService.update(username, user);
    return this.toResponse(updatedUser);
  }

  @Delete(':username')
  async delete(@Param('username') username: string) {
    return this.userService.delete(username);
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
}
