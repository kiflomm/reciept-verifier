import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { BANK_VERIFIERS } from './providers/bank-verifier.token';
import { BankVerifier } from './providers/bank-verifier.interface';

describe('VerifyController', () => {
  let controller: VerifyController;
  let mockCbeVerifier: jest.Mocked<BankVerifier>;

  beforeEach(async () => {
    mockCbeVerifier = {
      bankId: 'cbe',
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
      providers: [
        VerifyService,
        {
          provide: BANK_VERIFIERS,
          useValue: [mockCbeVerifier],
        },
      ],
    }).compile();

    controller = module.get(VerifyController);
  });

  it('returns success payload from CBE verifier', async () => {
    mockCbeVerifier.verify.mockResolvedValue({
      success: true,
      payer: 'Alice',
      amount: 100,
      reference: 'TXN1',
    });

    await expect(
      controller.verifyCbe({ reference: 'AbCdEfGhIjKlMnOpQr' }),
    ).resolves.toMatchObject({
      success: true,
      payer: 'Alice',
      amount: 100,
    });
  });

  it('maps legacy rejection to HTTP 400', async () => {
    mockCbeVerifier.verify.mockResolvedValue({
      success: false,
      error:
        'Legacy CBE receipts are not supported. Use a mbreciept.cbe.com.et token or URL.',
      statusCode: 400,
    });

    await expect(
      controller.verifyCbe({ reference: 'FT2513001V2G' }),
    ).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.verifyCbe({ reference: 'FT2513001V2G' });
    } catch (err) {
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual({
        success: false,
        error:
          'Legacy CBE receipts are not supported. Use a mbreciept.cbe.com.et token or URL.',
      });
    }
  });
});
