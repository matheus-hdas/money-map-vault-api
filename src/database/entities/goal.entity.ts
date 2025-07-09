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

export enum GoalType {
  SAVINGS = 'savings',
  DEBT_PAYMENT = 'debt_payment',
  SPENDING_LIMIT = 'spending_limit',
  INVESTMENT = 'investment',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum GoalPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GoalType })
  type: GoalType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'BRL' })
  currency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  targetDate: Date;

  @Column({ type: 'enum', enum: GoalPeriod, default: GoalPeriod.MONTHLY })
  period: GoalPeriod;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @Column({ type: 'varchar', length: 7, default: '#4caf50' })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'boolean', default: true })
  autoCalculate: boolean;

  @Column({ type: 'json', nullable: true })
  milestones: object[];

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.goals, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Category, (category) => category.goals, {
    onDelete: 'SET NULL',
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;
}
