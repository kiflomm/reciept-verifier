import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import * as https from 'https';
import { firstValueFrom } from 'rxjs';

import { VerifyResult } from '../../../common/types/verify-result';
import {
  BankVerifier,
  BankVerifyInput,
} from '../bank-verifier.interface';

import { extractCbeToken } from './cbe-reference';

interface CbeTransactionResponse {
  id?: string;
  debitAccountHolder?: string;
  debitAccountNo?: string;
  creditAccountHolder?: string;
  creditAccountNo?: string;
  amountCredited?: string;
  dateTimes?: string[];
  paymentDetails?: string[];
}

const DEFAULT_CBE_APP_ID = 'd1292e42-7400-49de-a2d3-9731caa4c819';
const DEFAULT_CBE_APP_VERSION = '0a01980b-9859-1369-8198-59f403820000';
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1800;

@Injectable()
export class CbeVerifier implements BankVerifier {
  readonly bankId = 'cbe';
  private readonly logger = new Logger(CbeVerifier.name);
  private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verify(input: BankVerifyInput): Promise<VerifyResult> {
    const token = extractCbeToken(input.reference);
    if (!token) {
      return {
        success: false,
        error: 'Unsupported CBE reference.',
        statusCode: 400,
      };
    }

    return this.verifyReceipt(token);
  }

  private async verifyReceipt(token: string): Promise<VerifyResult> {
    const url = `https://mb.cbe.com.et/api/v1/transactions/public/transaction-detail/${token}`;
    const appId =
      this.configService.get<string>('CBE_APP_ID') || DEFAULT_CBE_APP_ID;
    const appVersion =
      this.configService.get<string>('CBE_APP_VERSION') ||
      DEFAULT_CBE_APP_VERSION;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.log(
          `Attempting CBE JSON fetch (${attempt}/${MAX_RETRIES}): ${url}`,
        );

        const response = await firstValueFrom(
          this.httpService.get<CbeTransactionResponse>(url, {
            httpsAgent: this.httpsAgent,
            headers: {
              Accept: 'application/json, text/plain, */*',
              Origin: 'https://mbreciept.cbe.com.et',
              Referer: 'https://mbreciept.cbe.com.et/',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'x-app-id': appId,
              'x-app-version': appVersion,
            },
            timeout: 15000,
          }),
        );

        return this.mapReceipt(response.data);
      } catch (err) {
        const axiosError = err as AxiosError;
        const statusCode = axiosError.response?.status;
        const isLastAttempt = attempt === MAX_RETRIES;
        const isRetryable =
          !statusCode ||
          statusCode === 429 ||
          statusCode === 502 ||
          statusCode === 503 ||
          statusCode === 504;

        this.logger.warn(
          `CBE verification attempt ${attempt}/${MAX_RETRIES} failed: ${axiosError.message}`,
        );

        if (statusCode === 404) {
          return {
            success: false,
            error: 'Invalid or expired CBE receipt token.',
            statusCode: 404,
          };
        }

        if (!isRetryable || isLastAttempt) {
          return {
            success: false,
            error:
              'CBE receipt service is temporarily unavailable. Please try again.',
            statusCode: 502,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    return {
      success: false,
      error:
        'CBE receipt service is temporarily unavailable. Please try again.',
      statusCode: 502,
    };
  }

  private mapReceipt(data: CbeTransactionResponse): VerifyResult {
    const parsed = data.amountCredited
      ? Number.parseFloat(data.amountCredited)
      : NaN;

    return {
      success: true,
      payer: data.debitAccountHolder,
      payerAccount: data.debitAccountNo,
      receiver: data.creditAccountHolder,
      receiverAccount: data.creditAccountNo,
      amount: Number.isFinite(parsed) ? parsed : undefined,
      date: data.dateTimes?.[0] ? new Date(data.dateTimes[0]) : undefined,
      reference: data.id,
      reason: data.paymentDetails?.join(' ') || null,
    };
  }
}
