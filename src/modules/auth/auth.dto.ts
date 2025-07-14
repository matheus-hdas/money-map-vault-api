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
