import { VerifyResult } from '../../common/types/verify-result';

export interface BankVerifyInput {
  reference: string;
}

export interface BankVerifier {
  readonly bankId: string;
  verify(input: BankVerifyInput): Promise<VerifyResult>;
}
