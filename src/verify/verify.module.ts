import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BANK_VERIFIERS } from './providers/bank-verifier.token';
import { CbeVerifier } from './providers/cbe/cbe.verifier';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

@Module({
  imports: [HttpModule],
  controllers: [VerifyController],
  providers: [
    CbeVerifier,
    {
      provide: BANK_VERIFIERS,
      useFactory: (cbe: CbeVerifier) => [cbe],
      inject: [CbeVerifier],
    },
    VerifyService,
  ],
})
export class VerifyModule {}
