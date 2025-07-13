import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return (await bcrypt.hash(
      password,
      this.getRoundsByEnvironment(),
    )) as string;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return (await bcrypt.compare(password, hash)) as boolean;
  }

  private getRoundsByEnvironment(): number {
    const environment = process.env.NODE_ENV;
    if (environment === 'production') {
      return 14;
    }

    return 1;
  }
}
