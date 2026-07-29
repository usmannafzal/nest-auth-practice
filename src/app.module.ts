import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import{ ConfigModule, ConfigService} from '@nestjs/config' 
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { UserSession } from './auth/user-session.entity';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, 
    envFilePath: `.env.${process.env.NODE_ENV}`,
  }),TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_NAME'),
      autoLoadEntities: true,
      synchronize: true,
      entities: [User, UserSession]
    }),
  }), AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
