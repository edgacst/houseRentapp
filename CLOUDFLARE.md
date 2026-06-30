# Cloudflare Workers + Hono + D1 배포

이 프로젝트는 기존 Express/PostgreSQL 서버를 유지하면서, Cloudflare 배포용 Worker API를 `worker/`에 별도로 제공합니다.

## 구성

- Frontend: React/Vite build output (`dist`)
- API: Hono Worker (`worker/index.ts`)
- DB: Cloudflare D1 (`worker/schema.sql`)
- Static assets: Wrangler Assets binding

## 최초 설정

1. Cloudflare에 로그인합니다.

```bash
npx wrangler login
```

2. D1 데이터베이스를 만듭니다.

```bash
npx wrangler d1 create houserent-db
```

3. 출력된 `database_id`를 `wrangler.jsonc`의 `REPLACE_WITH_D1_DATABASE_ID`에 넣습니다.

4. 운영 JWT_SECRET을 설정합니다.

```bash
npx wrangler secret put JWT_SECRET
```

5. D1 스키마를 원격 DB에 적용합니다.

```bash
npm run d1:init:remote
```

6. 빌드 후 배포합니다.

```bash
npm run deploy:worker
```

## 로컬 Worker 테스트

```bash
npm run build
npm run d1:init
npm run dev:worker
```

로컬 Worker 주소는 기본적으로 `http://127.0.0.1:8787`입니다.

## 주의

- 기존 PostgreSQL 데이터는 자동 이전되지 않습니다. 운영 전 데이터 이관 스크립트가 필요합니다.
- Worker 인증은 신규 D1 사용자부터 PBKDF2 해시를 사용합니다. 기존 PostgreSQL의 bcrypt 비밀번호 해시는 그대로 로그인할 수 없습니다.
- 현재 Cloudflare Worker API는 일반 사용자 앱 흐름을 우선 지원합니다. 관리자 사용자 관리 화면은 별도 확장이 필요합니다.
