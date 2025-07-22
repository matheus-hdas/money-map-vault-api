import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Account } from './account.entity';
import { Category } from './category.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 10, default: 'BRL' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurringPattern: string;

  @Column({ type: 'date', nullable: true })
  recurringEndDate: Date;

  @Column({ type: 'uuid', nullable: true })
  recurringGroupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Category, (category) => category.transactions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => Account, (account) => account.transactionsFrom, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'fromAccountId' })
  fromAccount?: Account;

  @Column({ type: 'uuid', nullable: true })
  fromAccountId: string;

  @ManyToOne(() => Account, (account) => account.transactionsTo, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'toAccountId' })
  toAccount?: Account;

  @Column({ type: 'uuid', nullable: true })
  toAccountId: string;
}
