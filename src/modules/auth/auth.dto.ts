export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  locale?: string;
  timezone?: string;
  defaultCurrency?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiration: number;
};
