# Environment Setup Guide

Hướng dẫn cấu hình environment variables cho Open ERP SaaS.

## Cấu trúc File

Tất cả dự án (backend, web, mobile, deploy) đều load environment variables từ **root workspace**:

```
open-erp/
├── .env                        ← Chính (root) — DO NOT commit
├── .env.local / .env.dev.local ← Local dev overrides — DO NOT commit
├── .env.staging                ← Staging overrides — DO NOT commit
├── .env.production             ← Production overrides — DO NOT commit
├── .env.example                ← Template & documentation (COMMIT)
└── ...
```

## Mức độ ưu tiên (Priority)

Backend ConfigModule load theo thứ tự ưu tiên từ cao đến thấp:

```typescript
envFilePath: [
  '../../.env.local',    // 1️⃣ .env.dev.local (highest priority — local overrides)
  '../../.env',          // 2️⃣ .env (main config)
]
```

Ví dụ: Nếu `.env.local` định nghĩa `REDIS_PASSWORD=local123`, nó sẽ override giá trị ở `.env`.

---

## Hướng dẫn Local Development

### 1. Chuẩn bị file `.env`

```bash
# Tại root workspace (open-erp/)
cp .env.example .env
```

File `.env` sẽ chứa tất cả biến môi trường mặc định cho development. **Do NOT commit file này.**

### 2. Cấu hình optional overrides (`.env.local`)

Nếu cần override giá trị cụ thể cho máy local của bạn:

```bash
# Tạo file .env.local (git-ignored)
cat > .env.local << 'EOF'
# Ví dụ: override MongoDB password
MONGO_INITDB_ROOT_PASSWORD=my_local_password

# Ví dụ: override OAuth2 keys cho local testing
GOOGLE_CLIENT_ID=<your-local-google-client-id>
GOOGLE_CLIENT_SECRET=<your-local-google-client-secret>
EOF
```

**Chỉ** định nghĩa các biến bạn muốn override. Các biến khác sẽ load từ `.env`.

### 3. Kiểm tra biến môi trường

```bash
# Backend sẽ load từ .env (hoặc override từ .env.local)
cd open-erp-backend
npm run start:dev

# Kiểm tra logs để xác nhận ConfigModule load thành công
# Bạn sẽ thấy: "[Nest] 12345 - 05/12/2026, 10:30:00 PM     LOG [NestFactory] Starting Nest application..."
```

### 4. Docker Compose Local

```bash
# Start tất cả services (MongoDB, RabbitMQ, Redis, MinIO, Backend)
npm run dev

# Xem logs
npm run dev:logs

# Stop
npm run dev:down
```

**What happens:**
- `.env` được load bởi `docker-compose.yml`
- MongoDB, RabbitMQ, Redis, MinIO nhận biến từ `env_file: .env`
- Backend container nhận cùng `.env` + ConfigModule load lại bên trong ứng dụng

---

## Hướng dẫn Staging Environment

### 1. Tạo file `.env.staging`

```bash
cat > .env.staging << 'EOF'
NODE_ENV=staging
ENVIRONMENT=staging
PORT=3000

# MongoDB (staging RDS)
MONGO_INITDB_DATABASE=openErp_staging
MONGO_INITDB_ROOT_USERNAME=staging_admin
MONGO_INITDB_ROOT_PASSWORD=<from-vault>
MONGO_URI=mongodb://staging_admin:<password>@mongodb-staging.example.com:27017/openErp_staging?authSource=admin&replicaSet=rs0

# RabbitMQ (staging)
RABBITMQ_USER=staging_user
RABBITMQ_PASS=<from-vault>
RABBITMQ_URL=amqp://staging_user:<password>@rabbitmq-staging.example.com:5672/openErp

# Redis (staging)
REDIS_PASSWORD=<from-vault>
REDIS_URL=redis://:<password>@redis-staging.example.com:6379

# OAuth2 (staging endpoints)
GOOGLE_CLIENT_ID=<staging-google-client-id>
GOOGLE_CLIENT_SECRET=<from-vault>
GOOGLE_CALLBACK_URL=https://staging.openErp.example.com/auth/oauth/google/callback

MICROSOFT_CLIENT_ID=<staging-microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<from-vault>
MICROSOFT_CALLBACK_URL=https://staging.openErp.example.com/auth/oauth/microsoft/callback

# Frontend URLs
FRONTEND_URL=https://staging.openErp.example.com
API_GATEWAY_URL=https://api-staging.openErp.example.com
EOF
```

### 2. Deploy to Staging

```bash
# Copy staging config
npm run staging:env

# Verify .env matches staging
cat .env | head -20

# Start services with staging config
npm run staging:start

# Verify services started
docker-compose ps
docker-compose logs api-gateway
```

### 3. CI/CD Pipeline — Load secrets từ Vault

Trong `.github/workflows/deploy-staging.yml`:

```yaml
- name: Load Staging Secrets
  env:
    VAULT_ADDR: ${{ secrets.VAULT_ADDR }}
    VAULT_TOKEN: ${{ secrets.VAULT_TOKEN }}
  run: |
    # Retrieve staging secrets từ Vault
    vault kv get -format=json secret/staging/openErp > staging_secrets.json
    
    # Convert to .env format
    cat staging_secrets.json | jq '.data.data' > .env.staging
```

---

## Hướng dẫn Production Environment

### ⚠️ Critical Security Checklist

Trước khi deploy production, **đảm bảo:**

- ❌ **KHÔNG** commit `.env.production` vào git
- ✅ Tất cả secrets (JWT_SECRET, MONGO_PASS, etc.) phải từ Vault / Secret Manager
- ✅ `NODE_ENV=production` bắt buộc
- ✅ TLS/HTTPS enabled cho tất cả external endpoints
- ✅ Image tag phải là commit SHA, không dùng `latest`

### 1. Tạo file `.env.production` (chỉ locally hoặc từ CI/CD)

```bash
# Chỉ tạo locally nếu testing production build:
cat > .env.production << 'EOF'
NODE_ENV=production
ENVIRONMENT=production
PORT=3000

# MongoDB (production RDS)
MONGO_INITDB_DATABASE=openErp
MONGO_INITDB_ROOT_USERNAME=<prod-admin>
MONGO_INITDB_ROOT_PASSWORD=<secure-password-from-vault>
MONGO_URI=mongodb://<prod-admin>:<password>@mongodb-prod.example.com:27017/openErp?authSource=admin&replicaSet=rs0

# RabbitMQ (production)
RABBITMQ_USER=<prod-user>
RABBITMQ_PASS=<secure-password-from-vault>
RABBITMQ_URL=amqp://<prod-user>:<password>@rabbitmq-prod.example.com:5672/openErp

# Redis (production, high-availability)
REDIS_PASSWORD=<secure-password-from-vault>
REDIS_URL=redis://:<password>@redis-prod.example.com:6379

# JWT & OAuth2 (production keys)
JWT_SECRET=<long-secure-random-string-from-vault>
REFRESH_TOKEN_SECRET=<different-secure-string-from-vault>

GOOGLE_CLIENT_ID=<prod-google-client-id>
GOOGLE_CLIENT_SECRET=<from-vault>
GOOGLE_CALLBACK_URL=https://openErp.example.com/auth/oauth/google/callback

MICROSOFT_CLIENT_ID=<prod-microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<from-vault>
MICROSOFT_CALLBACK_URL=https://openErp.example.com/auth/oauth/microsoft/callback

# Frontend URLs (production domains)
FRONTEND_URL=https://openErp.example.com
API_GATEWAY_URL=https://api.openErp.example.com
ALLOWED_ORIGINS=https://openErp.example.com,https://app.openErp.example.com

# Rate limiting (production — stricter)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_AUTH_LIMIT=5
RATE_LIMIT_GLOBAL_LIMIT=50
EOF
```

### 2. Deploy to Production

```bash
# Tại CI/CD pipeline (e.g., GitHub Actions):
npm run prod:env
npm run prod:start

# Verify production deployment
docker-compose ps
curl https://api.openErp.example.com/health
```

### 3. Production CI/CD Pipeline Example

File `.github/workflows/deploy-prod.yml`:

```yaml
name: Deploy Production

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Load Production Secrets from Vault
        env:
          VAULT_ADDR: ${{ secrets.VAULT_ADDR }}
          VAULT_TOKEN: ${{ secrets.VAULT_TOKEN }}
        run: |
          # Retrieve production secrets từ HashiCorp Vault
          vault kv get -format=json secret/production/openErp > prod_secrets.json
          
          # Convert to .env format
          cat prod_secrets.json | jq '.data.data' > .env.production
      
      - name: Prepare Production Environment
        run: npm run prod:env
      
      - name: Build Docker Images
        run: |
          docker build -t open-erp-backend:${{ github.sha }} ./open-erp-backend
          docker push ${{ secrets.DOCKER_REGISTRY }}/open-erp-backend:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-gateway api-gateway=${{ secrets.DOCKER_REGISTRY }}/open-erp-backend:${{ github.sha }}
          kubectl rollout status deployment/api-gateway
      
      - name: Health Check
        run: |
          curl -f https://api.openErp.example.com/health || exit 1
```

---

## Reference: Tất cả Environment Variables

### App Configuration

| Variable            | Required | Default                          | Mô tả                                  |
| ------------------- | -------- | -------------------------------- | -------------------------------------- |
| `NODE_ENV`          | ✅ Yes   | `development`                    | Node environment                       |
| `ENVIRONMENT`       | ✅ Yes   | `dev`                            | App environment tag                    |
| `PORT`              | ✅ Yes   | `3000`                           | Backend API port                       |
| `ALLOWED_ORIGINS`   | ✅ Yes   | `http://localhost:4200,4201`     | CORS allowed origins                   |
| `FRONTEND_URL`      | ✅ Yes   | `http://localhost:4200`          | Frontend base URL                      |
| `API_GATEWAY_URL`   | ✅ Yes   | `http://localhost:3000`          | API Gateway base URL                   |

### Database (MongoDB)

| Variable                   | Required | Default                                      | Mô tả                             |
| -------------------------- | -------- | -------------------------------------------- | --------------------------------- |
| `MONGO_INITDB_DATABASE`    | ✅ Yes   | `openErp`                                    | Database name                     |
| `MONGO_INITDB_ROOT_USERNAME` | ✅ Yes  | `admin`                                      | Root username                     |
| `MONGO_INITDB_ROOT_PASSWORD` | ✅ Yes  | `password`                                   | Root password (change in staging) |
| `MONGO_RS_NAME`            | ✅ Yes   | `rs0`                                        | Replica set name                  |
| `MONGO_PORT`               | ✅ Yes   | `27017`                                      | MongoDB port                      |
| `MONGO_URI`                | ✅ Yes   | `mongodb://...` (computed)                   | Full MongoDB connection string    |

### Message Broker (RabbitMQ)

| Variable                   | Required | Default            | Mô tả               |
| -------------------------- | -------- | ------------------ | ------------------- |
| `RABBITMQ_USER`            | ✅ Yes   | `erp_user`         | RabbitMQ username   |
| `RABBITMQ_PASS`            | ✅ Yes   | `changeme_dev`     | RabbitMQ password   |
| `RABBITMQ_VHOST`           | ✅ Yes   | `openErp`          | Virtual host        |
| `RABBITMQ_PORT`            | ✅ Yes   | `5672`             | RabbitMQ port       |
| `RABBITMQ_MANAGEMENT_PORT` | ⚠️  Opt  | `15672`            | Management UI port  |
| `RABBITMQ_URL`             | ✅ Yes   | `amqp://...`       | Full connection URL |

### Cache (Redis)

| Variable         | Required | Default          | Mô tả               |
| ---------------- | -------- | ---------------- | ------------------- |
| `REDIS_PASSWORD` | ✅ Yes   | `changeme_dev`   | Redis password      |
| `REDIS_PORT`     | ✅ Yes   | `6379`           | Redis port          |
| `REDIS_URL`      | ✅ Yes   | `redis://...`    | Full connection URL |

### Object Storage (MinIO)

| Variable           | Required | Default                | Mô tả                   |
| ------------------ | -------- | ---------------------- | ----------------------- |
| `MINIO_ACCESS_KEY` | ✅ Yes   | `erp_minio`            | MinIO access key        |
| `MINIO_SECRET_KEY` | ✅ Yes   | `changeme_dev_secret`  | MinIO secret key        |
| `MINIO_ENDPOINT`   | ✅ Yes   | `minio`                | MinIO endpoint hostname |
| `MINIO_API_PORT`   | ✅ Yes   | `9000`                 | MinIO API port          |
| `MINIO_CONSOLE_PORT` | ⚠️ Opt | `9001`                 | MinIO console port      |

### JWT & Security

| Variable                 | Required | Default                  | Mô tả                        |
| ------------------------ | -------- | ------------------------ | ---------------------------- |
| `JWT_SECRET`             | ✅ Yes   | `dev-secret-change-me`   | JWT signing secret (change!) |
| `JWT_EXPIRE`             | ✅ Yes   | `24h`                    | JWT expiration time          |
| `REFRESH_TOKEN_SECRET`   | ✅ Yes   | `dev-refresh-secret`     | Refresh token secret         |
| `REFRESH_TOKEN_EXPIRE`   | ✅ Yes   | `7d`                     | Refresh token expiration     |

### Rate Limiting

| Variable                  | Required | Default | Mô tả                            |
| ------------------------- | -------- | ------- | -------------------------------- |
| `RATE_LIMIT_WINDOW_MS`    | ✅ Yes   | `60000` | Rate limit time window (ms)      |
| `RATE_LIMIT_AUTH_LIMIT`   | ✅ Yes   | `10`    | Auth endpoint requests/window    |
| `RATE_LIMIT_GLOBAL_LIMIT` | ✅ Yes   | `100`   | Global requests/window           |

### OAuth2 (Social Login)

| Variable                   | Required | Default | Mô tả                           |
| -------------------------- | -------- | ------- | ------------------------------- |
| `GOOGLE_CLIENT_ID`         | ⚠️ Opt   | —       | Google OAuth2 client ID         |
| `GOOGLE_CLIENT_SECRET`     | ⚠️ Opt   | —       | Google OAuth2 secret            |
| `GOOGLE_CALLBACK_URL`      | ⚠️ Opt   | —       | Google OAuth2 callback URL      |
| `MICROSOFT_CLIENT_ID`      | ⚠️ Opt   | —       | Microsoft OAuth2 client ID      |
| `MICROSOFT_CLIENT_SECRET`  | ⚠️ Opt   | —       | Microsoft OAuth2 secret         |
| `MICROSOFT_CALLBACK_URL`   | ⚠️ Opt   | —       | Microsoft OAuth2 callback URL   |

### Development Tools (local only)

| Variable            | Required | Default | Mô tả              |
| ------------------- | -------- | ------- | ------------------ |
| `ADMINER_PORT`      | ⚠️ Opt   | `8080`  | Adminer (DB GUI)   |
| `REDIS_COMMANDER_PORT` | ⚠️ Opt | `8081`  | Redis Commander UI |

### Upstream Services (API Gateway)

| Variable             | Required | Default                | Mô tả                  |
| -------------------- | -------- | ---------------------- | ---------------------- |
| `AUTH_SERVICE_URL`   | ✅ Yes   | `http://localhost:3001` | Auth service URL       |
| `TENANT_SERVICE_URL` | ✅ Yes   | `http://localhost:3002` | Tenant service URL     |
| `USER_SERVICE_URL`   | ✅ Yes   | `http://localhost:3003` | User service URL       |

---

## Troubleshooting

### Problem: `MONGO_URI mismatch`

**Symptom:** Backend không kết nối MongoDB

```
MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**

```bash
# Kiểm tra ConfigModule load đúng MONGO_URI
docker-compose logs api-gateway | grep "MONGO"

# Xác nhận .env có giá trị đúng
cat .env | grep MONGO_URI

# Xác nhận MongoDB service đang chạy
docker-compose ps mongodb
```

### Problem: `OAuth2 Client ID is empty`

**Symptom:** Social login failed

```
Error: Missing GOOGLE_CLIENT_ID
```

**Solution:**

```bash
# Tạo .env.local với OAuth2 keys
echo "GOOGLE_CLIENT_ID=<your-client-id>" >> .env.local
echo "GOOGLE_CLIENT_SECRET=<your-secret>" >> .env.local

# Backend sẽ load từ .env.local (override)
npm run dev
```

### Problem: `Port already in use`

**Symptom:**

```
Error: listen EADDRINUSE :::3000
```

**Solution:**

```bash
# Override PORT ở .env.local
echo "PORT=3001" >> .env.local

# Hoặc kill process hiện tại
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
```

---

## Checklist — Trước khi Deploy

- [ ] `.env.example` có tất cả required variables
- [ ] `.env` hoặc `.env.local` được tạo từ template
- [ ] `NODE_ENV` = `development` (dev) / `staging` / `production`
- [ ] `MONGO_URI` trỏ đúng database
- [ ] `RABBITMQ_URL` trỏ đúng broker
- [ ] `JWT_SECRET` được đổi từ default (staging/production)
- [ ] OAuth2 keys được cấu hình (Google/Microsoft)
- [ ] Tất cả secrets lưu ở Vault, không hardcode
- [ ] `.gitignore` bao gồm `.env`, `.env.*` (trừ `.env.example`)
- [ ] ConfigModule load successfully (check logs)
- [ ] Services kết nối thành công (health check)

---

## References

- [NestJS ConfigModule Documentation](https://docs.nestjs.com/techniques/configuration)
- [Docker Compose env_file](https://docs.docker.com/compose/compose-file/compose-file-v3/#env_file)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [12 Factor App — Configuration](https://12factor.net/config)
