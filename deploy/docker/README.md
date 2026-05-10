# Docker Deploy Assets

## Thành phần

- `compose.local.yml`: stack local cho Sprint 01 (infra + api-gateway).
- `compose.staging.yml`: stack staging tối giản cho api-gateway.
- `.env.local.template`: mẫu biến môi trường local.
- `.env.staging.template`: mẫu biến môi trường staging.

## Chạy local

1. Tạo file env:

```bash
cp deploy/docker/.env.local.template deploy/docker/.env.local
```

2. Triển khai:

```bash
docker compose --env-file deploy/docker/.env.local -f deploy/docker/compose.local.yml up -d
```

3. Kiểm tra:

```bash
docker compose --env-file deploy/docker/.env.local -f deploy/docker/compose.local.yml ps
```

## Staging

```bash
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/compose.staging.yml up -d
```

## Secret guideline

- Không commit `.env.local` hoặc `.env.staging` có giá trị thật.
- Dùng secret manager của môi trường CI/CD để inject runtime secret.
