import { ApiMeta } from 'src/app.dto';

export type CreateUserRequest = {
  username: string;
  email: string;
  password: string;
};

export type UpdateUserRequest = {
  username?: string;
  email?: string;
  password?: string;
  locale?: string;
  timezone?: string;
  defaultCurrency?: string;
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  locale: string;
  timezone: string;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPagedResponse = {
  success: true;
  data: UserResponse[];
  meta: ApiMeta;
};
