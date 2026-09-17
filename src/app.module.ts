import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VerifyModule } from './verify/verify.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VerifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
