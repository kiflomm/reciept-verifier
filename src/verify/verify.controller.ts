import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { VerifyCbeDto } from './dto/verify-cbe.dto';
import { VerifyService } from './verify.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Post('cbe')
  @HttpCode(HttpStatus.OK)
  verifyCbe(@Body() dto: VerifyCbeDto) {
    return this.verifyService.verifyCbe(dto.reference);
  }
}
