# Tài liệu hướng dẫn tái cấu trúc: REF-1.5 - Chuyển đổi cấu hình cứng sang sử dụng NestJS ConfigModule
## Phân hệ: Backend API Service (`open-erp-services`) - Sprint 1

---

### 1. Mục tiêu (Goal)
Nhằm tăng tính linh hoạt khi triển khai ứng dụng (Deployment) trên các môi trường khác nhau (Dev Local, Staging, Production) mà không cần thay đổi mã nguồn, thống nhất chuyển đổi toàn bộ các cấu hình đang để cứng (hardcode) sang sử dụng bộ quản lý cấu hình chuẩn của NestJS (`@nestjs/config`).

---

### 2. Lý do kỹ thuật (Rationale)
* **Nguyên tắc Twelve-Factor App**: Lưu trữ cấu hình trong môi trường (Environment Variables) là nguyên tắc cốt lõi giúp mã nguồn độc lập với môi trường chạy thực tế.
* **NestJS Standard**: Sử dụng `@nestjs/config` và `ConfigService` giúp quản lý tập trung, cung cấp cơ chế dự phòng (fallback values) và hỗ trợ kiểm tra kiểu dữ liệu của biến môi trường dễ dàng.
* **Dễ dàng triển khai**: Phục vụ việc deploy dự án lên Docker Compose hoặc Kubernetes (K8s) bằng cách truyền các biến môi trường thay vì sửa code.

---

### 3. Hướng dẫn chuyển đổi (Migration Guide)

#### 3.1 Cài đặt thư viện:
Cài đặt `@nestjs/config` trong phân hệ backend:
```bash
npm install @nestjs/config
```

#### 3.2 Đăng ký ConfigModule toàn cục trong `AppModule`:
Đăng ký `ConfigModule.forRoot` với thuộc tính `isGlobal: true` trong [app.module.ts](../../../../open-erp-services/src/app.module.ts).

#### 3.3 Chuyển đổi cấu hình TypeORM:
Sử dụng `TypeOrmModule.forRootAsync` thay vì `TypeOrmModule.forRoot` để có thể inject `ConfigService` động:
* **Trước**:
  ```typescript
  TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'localpassword',
    database: 'open_erp_dev',
    entities: [Tenant, User],
    synchronize: true,
  })
  ```
* **Sau**:
  ```typescript
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get<string>('DB_USERNAME', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'localpassword'),
      database: configService.get<string>('DB_DATABASE', 'open_erp_dev'),
      entities: [Tenant, User],
      synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
    }),
  })
  ```

#### 3.4 Chuyển đổi cấu hình Redis:
Inject `ConfigService` vào `RedisService` và tải cấu hình động:
* **Trước**:
  ```typescript
  this.client = new Redis({
    host: 'localhost',
    port: 6379,
  });
  ```
* **Sau**:
  ```typescript
  this.client = new Redis({
    host: this.configService.get<string>('REDIS_HOST', 'localhost'),
    port: this.configService.get<number>('REDIS_PORT', 6379),
  });
  ```

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Ứng dụng backend khởi chạy thành công (`npm run build` và `npm run start`).
2. Kết nối tới database Postgres và cache Redis thành công ở môi trường mặc định (localhost) sử dụng các cấu hình fallback.
3. Khi thay đổi các biến môi trường tương ứng (ví dụ: `DB_HOST`, `REDIS_HOST`), ứng dụng kết nối tới các địa chỉ mới cấu hình chính xác.
4. Đảm bảo toàn bộ test suite chạy thành công (`npm run test`).

---

### 5. Kết quả thực hiện (Implementation Status)
- **Trạng thái**: [x] Đã hoàn thành (Completed)
- **Kết quả**:
  - Đăng ký `ConfigModule.forRoot({ isGlobal: true })` trong [app.module.ts](../../../../open-erp-services/src/app.module.ts).
  - Tái cấu trúc TypeORM sang dùng `TypeOrmModule.forRootAsync` và `ConfigService` trong [app.module.ts](../../../../open-erp-services/src/app.module.ts).
  - Tái cấu trúc `RedisService` sang inject `ConfigService` và lấy cấu hình động trong [redis.service.ts](../../../../open-erp-services/src/core/redis/redis.service.ts).
  - Biên dịch dự án thành công và toàn bộ 9 test cases chạy pass 100%.
