# houseRentapp

부동산 임대관리앱 HOUSERENT입니다.

## 주요 기능

- 대시보드 임대 현황 요약
- 건물 관리
- 호실 관리
- 임차인 관리
- 계약 관리
- 월세 청구 및 수납 관리
- 통계 화면

## 개발 실행

```bash
npm install
npm run dev
```

## API 서버와 DB

1. PostgreSQL을 실행합니다. Docker를 쓰는 경우 아래 명령으로 실행할 수 있습니다.

```bash
docker compose up -d
```

2. `.env.example`을 `.env`로 복사하고 PostgreSQL 접속 정보를 수정합니다.

```bash
cp .env.example .env
```

3. Prisma Client를 생성하고 마이그레이션을 실행합니다.

```bash
npm run db:generate
npm run db:migrate
```

4. API 서버와 프론트 서버를 각각 실행합니다.

```bash
npm run dev:api
npm run dev
```

기본 API 주소는 `http://127.0.0.1:4000/api`입니다. Vite 개발 서버에서는 `/api` 요청이 API 서버로 프록시됩니다.

## 빌드

```bash
npm run build
```

## 검사

```bash
npm run typecheck:api
npm run lint
```
