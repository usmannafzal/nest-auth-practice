import { UserSession } from '../auth/user-session.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import _ from 'lodash';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column()
  password: string;

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  userSessions: UserSession[];

  get fullName(): string {
    return `${_.capitalize(this.firstName)} ${_.capitalize(this.lastName)}`;
  }
}
