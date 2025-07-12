import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserRequest, UpdateUserRequest } from './user.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Post()
  async create(@Body() user: CreateUserRequest) {
    return this.usersService.create(user);
  }

  @Patch(':username')
  async update(
    @Param('username') username: string,
    @Body() user: UpdateUserRequest,
  ) {
    return await this.usersService.update(username, user);
  }

  @Delete(':username')
  async delete(@Param('username') username: string) {
    return this.usersService.delete(username);
  }
}
