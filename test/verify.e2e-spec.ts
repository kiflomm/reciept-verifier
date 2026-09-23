import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { BANK_VERIFIERS } from './../src/verify/providers/bank-verifier.token';
import { BankVerifier } from './../src/verify/providers/bank-verifier.interface';

describe('VerifyController (e2e)', () => {
  let app: INestApplication<App>;
  let mockCbeVerifier: jest.Mocked<BankVerifier>;

  beforeEach(async () => {
    mockCbeVerifier = {
      bankId: 'cbe',
      verify: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BANK_VERIFIERS)
      .useValue([mockCbeVerifier])
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / still returns hello', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('POST /api/verify/cbe rejects missing reference', () => {
    return request(app.getHttpServer())
      .post('/api/verify/cbe')
      .send({})
      .expect(400);
  });

  it('POST /api/verify/cbe rejects unsupported references', async () => {
    mockCbeVerifier.verify.mockResolvedValue({
      success: false,
      error: 'Unsupported CBE reference.',
      statusCode: 400,
    });

    const res = await request(app.getHttpServer())
      .post('/api/verify/cbe')
      .send({ reference: 'FT2513001V2G' })
      .expect(400);

    expect(res.body).toEqual({
      success: false,
      error: 'Unsupported CBE reference.',
    });
  });

  it('POST /api/verify/cbe returns mapped success body', async () => {
    mockCbeVerifier.verify.mockResolvedValue({
      success: true,
      payer: 'Alice',
      payerAccount: '1****1234',
      receiver: 'Bob',
      receiverAccount: '2****5678',
      amount: 250,
      reference: 'TXN99',
      reason: null,
    });

    const res = await request(app.getHttpServer())
      .post('/api/verify/cbe')
      .send({ reference: 'AbCdEfGhIjKlMnOpQr' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.payer).toBe('Alice');
    expect(res.body.amount).toBe(250);
  });
});
