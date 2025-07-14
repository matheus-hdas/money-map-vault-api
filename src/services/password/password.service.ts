import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.getRoundsByEnvironment());
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private getRoundsByEnvironment(): number {
    return process.env.NODE_ENV === 'production' ? 14 : 1;
  }
}
