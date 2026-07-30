import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'access_token_hash' })
  accessTokenHash: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ default: false })
  revoked: boolean;

  @ManyToOne(() => User, (user) => user.userSessions, { onDelete: 'CASCADE' })
  user: User;
}
