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
import { Goal } from './goal.entity';
import { Budget } from './budget.entity';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ type: 'varchar', length: 7, default: '#2196f3' })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  @ManyToOne(() => User, (user) => user.categories, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions?: Transaction[];

  @OneToMany(() => Goal, (goal) => goal.category)
  goals?: Goal[];

  @OneToMany(() => Budget, (budget) => budget.category)
  budgets?: Budget[];
}
