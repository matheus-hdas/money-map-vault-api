import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CASH = 'cash',
  OTHER = 'other',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accountNumber: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  initialBalance: number;

  @Column({ type: 'varchar', length: 10, default: 'BRL' })
  currency: string;

  @Column({ type: 'varchar', length: 7, default: '#1976d2' })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  includeInTotals: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.fromAccount)
  transactionsFrom?: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.toAccount)
  transactionsTo?: Transaction[];
}
