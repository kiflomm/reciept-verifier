# verifier-api

NestJS service for verifying Ethiopian bank receipts.

## Scope (v1)

- **Supported:** CBE (Commercial Bank of Ethiopia) **new** receipts only — `mbreciept.cbe.com.et` tokens/URLs via the public JSON API.
- **Out of scope:** Legacy CBE (`FT…` + account suffix, `apps.cbe.com.et` PDF/Puppeteer). Do not reintroduce Puppeteer/PDF without an explicit product decision.
- Auth is not required in v1.

## Architecture

- Feature module: `src/verify/`
- Shared result type: `src/common/types/verify-result.ts`
- Bank providers implement `BankVerifier` under `src/verify/providers/<bank>/`
- Providers are registered as a multi-provider via `BANK_VERIFIERS`; `VerifyService` resolves by `bankId`
- To add a bank: implement `BankVerifier`, register it in `VerifyModule`, add `POST /api/verify/<bank>`

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/` | Health/hello (excluded from `api` prefix) |
| `POST` | `/api/verify/cbe` | Body: `{ "reference": "<token or mbreciept URL>" }` |

## Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `CBE_APP_ID` | CBE API `x-app-id` header (has default) |
| `CBE_APP_VERSION` | CBE API `x-app-version` header (has default) |

## Conventions

- Global prefix: `api` (except `GET /`)
- Global `ValidationPipe`: whitelist, forbid non-whitelisted, transform
- Failures return `{ success: false, error: string }` with status `400` / `404` / `422` / `502`
