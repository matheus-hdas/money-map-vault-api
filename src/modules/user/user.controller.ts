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
import { UserService } from './user.service';
import { CreateUserRequest, UpdateUserRequest } from './user.dto';

@Controller('api/v1/users')
export class UserController {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.findAll(page, limit);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Post()
  async create(@Body() user: CreateUserRequest) {
    return this.userService.create(user);
  }

  @Patch(':username')
  async update(
    @Param('username') username: string,
    @Body() user: UpdateUserRequest,
  ) {
    return await this.userService.update(username, user);
  }

  @Delete(':username')
  async delete(@Param('username') username: string) {
    return this.userService.delete(username);
  }
}
