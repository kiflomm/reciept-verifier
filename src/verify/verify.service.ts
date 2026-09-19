import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerifyResult } from '../common/types/verify-result';
import { BankVerifier } from './providers/bank-verifier.interface';
import { BANK_VERIFIERS } from './providers/bank-verifier.token';

@Injectable()
export class VerifyService {
  private readonly verifiersById: Map<string, BankVerifier>;

  constructor(@Inject(BANK_VERIFIERS) verifiers: BankVerifier[]) {
    this.verifiersById = new Map(
      verifiers.map((verifier) => [verifier.bankId, verifier]),
    );
  }

  async verifyCbe(reference: string): Promise<VerifyResult> {
    return this.verify('cbe', reference);
  }

  async verify(bankId: string, reference: string): Promise<VerifyResult> {
    const verifier = this.verifiersById.get(bankId);
    if (!verifier) {
      throw new NotFoundException(`Unsupported bank: ${bankId}`);
    }

    const result = await verifier.verify({ reference });
    if (!result.success) {
      throw new HttpException(
        {
          success: false,
          error: result.error ?? 'Verification failed.',
        },
        result.statusCode ?? HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return result;
  }
}
