import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    usr: string;
    currency: string;
    iss: string;
    iat: number;
    exp: number;
  };
};
