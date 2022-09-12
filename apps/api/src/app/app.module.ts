import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from 'nestjs-redis'
import { IpfsService } from './ipfs/ipfs.service';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      useFactory: () => ({ url: process.env.REDIS_URL }),
      inject: []

    }),
    HttpModule
  ],
  controllers: [AppController],
  providers: [AppService, IpfsService],
})
export class AppModule { }
