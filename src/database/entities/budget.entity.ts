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
import { Category } from './category.entity';

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum BudgetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXCEEDED = 'exceeded',
}

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  spent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  remaining: number;

  @Column({ type: 'varchar', length: 10, default: 'BRL' })
  currency: string;

  @Column({ type: 'enum', enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.ACTIVE })
  status: BudgetStatus;

  @Column({ type: 'varchar', length: 7, default: '#ff9800' })
  color: string;

  @Column({ type: 'boolean', default: true })
  autoReset: boolean;

  @Column({ type: 'boolean', default: true })
  alertEnabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  alertThreshold: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'boolean', default: true })
  includeSubcategories: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Category, (category) => category.budgets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ type: 'uuid' })
  categoryId: string;
}
