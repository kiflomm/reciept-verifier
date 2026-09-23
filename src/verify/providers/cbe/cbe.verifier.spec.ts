import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { CbeVerifier } from './cbe.verifier';

function axiosResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

function axiosError(status: number, message = 'Request failed'): AxiosError {
  const error = new AxiosError(message);
  error.response = {
    data: {},
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('CbeVerifier', () => {
  let verifier: CbeVerifier;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    httpService = { get: jest.fn() };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CBE_APP_ID') return 'test-app-id';
        if (key === 'CBE_APP_VERSION') return 'test-app-version';
        return undefined;
      }),
    };

    verifier = new CbeVerifier(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects unsupported references', async () => {
    const result = await verifier.verify({ reference: 'FT2513001V2G' });
    expect(result).toEqual({
      success: false,
      error: 'Unsupported CBE reference.',
      statusCode: 400,
    });
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('rejects invalid reference format', async () => {
    const result = await verifier.verify({ reference: 'short' });
    expect(result).toEqual({
      success: false,
      error: 'Unsupported CBE reference.',
      statusCode: 400,
    });
  });

  it('maps successful upstream JSON to VerifyResult', async () => {
    httpService.get.mockReturnValue(
      of(
        axiosResponse({
          id: 'TXN123',
          debitAccountHolder: 'Alice',
          debitAccountNo: '1****1234',
          creditAccountHolder: 'Bob',
          creditAccountNo: '2****5678',
          amountCredited: '1500.50',
          dateTimes: ['2026-01-15T10:00:00Z'],
          paymentDetails: ['Payment', 'for goods'],
        }),
      ),
    );

    const result = await verifier.verify({
      reference: 'AbCdEfGhIjKlMnOpQr',
    });

    expect(result.success).toBe(true);
    expect(result.payer).toBe('Alice');
    expect(result.receiver).toBe('Bob');
    expect(result.amount).toBe(1500.5);
    expect(result.reference).toBe('TXN123');
    expect(result.reason).toBe('Payment for goods');
    expect(result.date).toEqual(new Date('2026-01-15T10:00:00Z'));
  });

  it('returns 404 for expired tokens', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(404)));

    const result = await verifier.verify({
      reference: 'AbCdEfGhIjKlMnOpQr',
    });

    expect(result).toEqual({
      success: false,
      error: 'Invalid or expired CBE receipt token.',
      statusCode: 404,
    });
  });

  it('returns 502 when upstream is unavailable', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(500)));

    const result = await verifier.verify({
      reference: 'AbCdEfGhIjKlMnOpQr',
    });

    expect(result).toEqual({
      success: false,
      error:
        'CBE receipt service is temporarily unavailable. Please try again.',
      statusCode: 502,
    });
  });
});
