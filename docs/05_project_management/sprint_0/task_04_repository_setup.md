# Tài liệu kỹ thuật chi tiết: TSK-0.4 - Thiết lập 3 Repositories & Quy chuẩn lập trình (Convention)
## Phân hệ: Hạ tầng mã nguồn & Quy trình phát triển (Git & Setup - Sprint 0)

---

### 1. Mục tiêu công việc (Objective)
Thiết lập cấu trúc thư mục tiêu chuẩn, cài đặt cấu hình khung (boilerplate) cho 3 dự án mã nguồn độc lập bao gồm:
1. **`open-erp-services`** (Backend NestJS Microservices)
2. **`open-erp-web`** (Web Frontend Angular + TailwindCSS)
3. **`open-erp-mobile`** (Mobile Frontend Ionic/Angular)

Đồng bộ hóa các quy chuẩn lập trình (Coding Conventions), kiểm tra chất lượng mã nguồn tự động trước khi commit (Git Hooks với Husky & Lint-staged) và thiết lập tài liệu hướng dẫn chạy local cho lập trình viên.

---

### 2. Thiết kế cấu trúc chi tiết cho các Repository

#### 2.1 Backend: `open-erp-services` (NestJS)
Cấu trúc dự án backend được tổ chức theo mô hình Modular Monolith/Microservices định hướng Domain-Driven Design (DDD).

```text
open-erp-services/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/                  # Các tiện ích dùng chung toàn hệ thống
│   │   ├── decorators/          # Custom decorators (ví dụ: @CurrentUser, @Tenant)
│   │   ├── filters/             # Bộ lọc exception xử lý lỗi HTTP/Database
│   │   ├── guards/              # Các guard phân quyền Auth & RBAC
│   │   ├── interceptors/        # Interceptor format dữ liệu JSON trả về
│   │   ├── middlewares/         # TenantID extraction middleware
│   │   └── constants/           # Mã lỗi, hằng số cấu hình hệ thống
│   ├── core/                    # Core Business Modules (Multi-tenant, Auth, System)
│   │   ├── database/            # Cấu hình TypeORM / Prisma, RLS setup, migrations
│   │   ├── tenant/              # Module quản lý Tenant đăng ký
│   │   └── iam/                 # Identity & Access Management (User, Role, Permission)
│   └── features/                # Các phân hệ chức năng nghiệp vụ của ERP
│       ├── workspace/           # Phân hệ Quản lý công việc (Sprint 1)
│       └── crm/                 # Phân hệ Khách hàng & Cơ hội (Sprint 2)
├── test/                        # Thư mục chứa các unit & integration tests
├── .eslintrc.js                 # Cấu hình kiểm tra lỗi mã nguồn (Linting)
├── .prettierrc                  # Định dạng code tự động
├── package.json
└── tsconfig.json
```

* **Thiết lập Tenant Middleware:** Middleware bắt buộc lọc header `X-Tenant-ID` hoặc phân tích URL/Subdomain để xác định Tenant ID và lưu vào `AsyncLocalStorage` của NodeJS để TypeORM/Prisma sử dụng trong phiên kết nối database áp dụng chính sách RLS.

#### 2.2 Web Frontend: `open-erp-web` (Angular + TailwindCSS)
Cấu trúc dự án frontend web được thiết kế theo hướng module hóa, tận dụng cơ chế Lazy Loading của Angular để tối ưu hóa thời gian tải trang ban đầu.

```text
open-erp-web/
├── src/
│   ├── app/
│   │   ├── app.routes.ts        # Quản lý định tuyến và Lazy Loading
│   │   ├── app.config.ts        # Đăng ký providers (HTTP Interceptors, NgRx, v.v.)
│   │   ├── core/                # Singleton services (Auth, ApiService, TenantService)
│   │   ├── shared/              # Reusable UI Components, Pipes, Directives chung
│   │   │   ├── components/      # Button, Input, Modal, KanbanBoard, v.v.
│   │   │   └── pipes/           # Format tiền tệ Việt Nam (VND), ngày tháng
│   │   └── features/            # Các trang tính năng nghiệp vụ (Lazy Loaded)
│   │       ├── auth/            # Trang đăng nhập, đăng ký tenant
│   │       ├── dashboard/       # Trang chủ quản lý của Tenant
│   │       └── workspace/       # Quản lý công việc Kanban (Sprint 1)
│   ├── assets/                  # Ảnh, font chữ, icons
│   ├── index.html
│   ├── styles.css               # Chứa custom styling và Tailwind directives
│   └── main.ts
├── tailwind.config.js           # Cấu hình thiết lập theme và plugins TailwindCSS
├── angular.json
├── package.json
└── tsconfig.json
```

* **Cấu hình TailwindCSS:** Thiết lập bảng màu chuyên nghiệp (palette) tối giản, hỗ trợ Dark Mode và các thuộc tính khoảng cách hiển thị mật độ cao (compact spacing) để phục vụ yêu cầu tối giản hóa giao diện, hiển thị nhiều thông tin trên 01 màn hình.

#### 2.3 Mobile Frontend: `open-erp-mobile` (Ionic/Angular)
Tận dụng kiến trúc Angular của Ionic để tái sử dụng tối đa logic của Web Frontend, tích hợp Capacitor để build ra mã native iOS/Android.

```text
open-erp-mobile/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app-routing.module.ts
│   │   ├── core/                # Services quản lý Token, Device Info, Push Notifications
│   │   ├── shared/              # Mobile Custom Components (Card, List, Pull-to-refresh)
│   │   └── pages/               # Các trang giao diện dạng Ionic Page
│   │       ├── login/
│   │       ├── home/
│   │       ├── notification/    # Module nhận thông báo đẩy thời gian thực
│   │       └── task-detail/     # Chi tiết công việc và tương tác nhanh
│   ├── assets/
│   ├── theme/
│   │   └── variables.css        # Cấu hình CSS Variables của Ionic theme
│   └── main.ts
├── capacitor.config.ts          # Cấu hình Capacitor tích hợp Native SDKs
├── package.json
└── tsconfig.json
```

#### 2.4 Thư viện giao diện dùng chung: `open-erp-ui` (Shared UI Library)
Để tránh trùng lặp code và đảm bảo giao diện đồng bộ 100% giữa phiên bản Web và Mobile (cả hai đều sử dụng Angular), hệ thống thiết lập một thư viện UI dùng chung chạy độc lập.

```text
open-erp-ui/
├── projects/
│   └── shared-ui/
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/      # Các component dùng chung
│       │   │   │   ├── button/      # Custom Button hỗ trợ màu Rose Gold & Dark Mode
│       │   │   │   ├── input/       # Custom Input fields, validate lỗi
│       │   │   │   ├── kanban/      # Bảng công việc Kanban tối giản
│       │   │   │   └── modal/       # Hộp thoại popup kính mờ (glassmorphism)
│       │   │   ├── styles/
│       │   │   │   └── tailwind.css # Cấu hình CSS/Tailwind cơ sở
│       │   │   └── shared-ui.module.ts
│       │   └── public-api.ts        # Export các component ra ngoài
│       └── package.json
├── package.json
└── tsconfig.json
```
* **Cơ chế tích hợp & Biên dịch Tailwind CSS:** 
  Dự án `open-erp-ui` được phát triển độc lập, build thành gói npm cục bộ.
  1. **Định tuyến TypeScript:** Web và Mobile import thư viện thông qua cấu hình `paths` trong `tsconfig.json` trỏ trực tiếp đến thư mục build hoặc link thông qua cơ chế `npm link` cục bộ trong giai đoạn phát triển:
     ```json
     "paths": {
       "@open-erp/shared-ui": ["../open-erp-ui/dist/shared-ui"]
     }
     ```
  2. **Biên dịch CSS Tailwind dùng chung (Bắt buộc):** Để tránh phình dung lượng bundle do tự đóng gói CSS độc lập trong thư viện, các ứng dụng tiêu thụ (`open-erp-web` và `open-erp-mobile`) bắt buộc phải thêm đường dẫn quét mã nguồn của thư viện vào mảng `content` trong file `tailwind.config.js` của mình:
     ```javascript
     content: [
       "./src/**/*.{html,ts}",
       "../open-erp-ui/projects/shared-ui/src/lib/components/**/*.{html,ts}"
     ]
     ```
     Cấu hình này giúp compiler Tailwind của Web/Mobile tự động quét qua các standalone components của thư viện dùng chung để trích xuất các lớp utility (ví dụ: `bg-rose-gold-500`) và biên dịch trực tiếp vào file CSS đầu ra của ứng dụng.

---

#### 2.5 Cấu hình Màu sắc Hồng Vàng (Rose Gold) & Light/Dark Mode
* **Cấu hình trong Tailwind CSS (`tailwind.config.js`):**
  Thiết lập bộ mã màu Hồng Vàng (Rose Gold) và kích hoạt chế độ Dark Mode theo class (`darkMode: 'class'`) để thay đổi giao diện linh hoạt.
  ```javascript
  module.exports = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          'rose-gold': {
            50: '#FDF8F5',
            100: '#FBECE6',
            200: '#F6D2C4',
            300: '#EEA994',
            400: '#E27E67',
            500: '#B76E79', // Màu Hồng Vàng chủ đạo (Rose Gold)
            600: '#A45964',
            700: '#894650',
            800: '#723A43',
            900: '#5F323A',
          },
          'dark-bg': '#0F172A', // Slate 900
          'dark-card': '#1E293B', // Slate 800
          'light-bg': '#F8FAFC', // Slate 50
          'light-card': '#FFFFFF',
        }
      }
    }
  }
  ```
* **Cấu hình trong Ionic CSS Variables (`variables.css`):**
  Định nghĩa lại các biến màu của Ionic để khớp với màu Rose Gold:
  ```css
  :root {
    --ion-color-primary: #B76E79;
    --ion-color-primary-rgb: 183,110,121;
    --ion-color-primary-contrast: #ffffff;
    --ion-color-primary-shade: #a45964;
    --ion-color-primary-tint: #c27d87;
  ```

#### 2.6 Cấu hình Đa ngôn ngữ với Transloco (Internationalization - i18n)
Hệ thống quản trị doanh nghiệp bắt buộc hỗ trợ đa ngôn ngữ để phục vụ các doanh nghiệp đa quốc gia. Sử dụng thư viện **Transloco** (phiên bản stable mới nhất `@jsverse/transloco` version 8) cho cả Web Frontend (`open-erp-web`) và Mobile Frontend (`open-erp-mobile`).

* **Ngôn ngữ hỗ trợ mặc định:**
  - Tiếng Việt (`vi` - Mặc định)
  - Tiếng Anh (`en`)
  - Tiếng Trung Quốc (`zh`)
  - Tiếng Nhật Bản (`ja`)
* **Cấu trúc quản lý file dịch:**
  Các file ngôn ngữ dạng JSON được lưu trữ tại thư mục assets của Web và Mobile, đồng thời đồng bộ cấu trúc khóa (key-value):
  ```text
  src/assets/i18n/
  ├── vi.json       # Bản dịch Tiếng Việt
  ├── en.json       # Bản dịch Tiếng Anh
  ├── zh.json       # Bản dịch Tiếng Trung
  └── ja.json       # Bản dịch Tiếng Nhật
  ```
* **Cấu hình HttpLoader trong `app.config.ts`:**
  Đăng ký Transloco HttpLoader để tải file ngôn ngữ động từ assets:
  ```typescript
  import { HttpClient } from '@angular/common/http';
  import { Translation, TranslocoLoader, TRANSLOCO_LOADER, TRANSLOCO_CONFIG, translocoConfig, TranslocoModule } from '@jsverse/transloco';
  import { Injectable, isDevMode } from '@angular/core';

  @Injectable({ providedIn: 'root' })
  export class TranslocoHttpLoader implements TranslocoLoader {
    constructor(private http: HttpClient) {}
    getTranslation(lang: string) {
      return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
    }
  }

  export const translocoProviders = [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['vi', 'en', 'zh', 'ja'],
        defaultLang: 'vi',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      })
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader }
  ];
  ```
* **Sử dụng trong Thư viện UI chung (`open-erp-ui`):** Thư viện UI dùng chung được thiết kế nhận trực tiếp `translation keys` hoặc inject `TranslocoService` thông qua cơ chế Dependency Injection của Angular để thực hiện dịch nhãn (labels) động trên các nút bấm, tiêu đề bảng, thông báo lỗi.

#### 2.7 Nâng cấp & Quản lý tương thích của Dependencies (Dependency Management)
Để đảm bảo hệ thống vận hành ổn định, bảo mật và tránh xung đột phiên bản giữa 3 dự án lớn, toàn bộ dependencies được nâng cấp và đồng bộ lên các phiên bản **Stable mới nhất** tương thích với môi trường Node.js 22:

* **Ma trận phiên bản tương thích (Compatibility Matrix):**
  - **Node.js:** Bắt buộc sử dụng phiên bản **Node.js 22 LTS** (Active LTS).
  - **Backend (NestJS):** Sử dụng phiên bản **NestJS 11.x** (hoặc mới hơn stable tương thích Node 22).
  - **Frontend Web & Library (Angular / RxJS):** Sử dụng **Angular 22.x** (phiên bản stable mới nhất tương thích với Node 22) kết hợp **RxJS 8.x / 7.8.x**.
  - **Frontend Mobile (Ionic / Capacitor):** Sử dụng **Ionic 8.x** kết hợp với **Capacitor 8.x** (hoặc mới hơn stable), đảm bảo tương thích tốt nhất với cấu hình Angular 22 ở trên.
  - **CSS framework:** TailwindCSS v4.0.x (hoặc mới hơn tương thích với Angular 22).
* **Quy chuẩn quản lý Package & Lockfile:**
  - Lập trình viên **không được tự ý cài đặt package bằng ký tự đại diện `*` hoặc `latest`** trong file `package.json`. Phải ghi rõ phiên bản cố định hoặc sử dụng ký tự `^` để kiểm soát các bản vá lỗi minor/patch.
  - File `package-lock.json` phải được commit đầy đủ lên Git để đảm bảo môi trường CI/CD và local của mọi lập trình viên sử dụng chính xác 100% cùng một phiên bản thư viện.
  - Định kỳ cuối mỗi Sprint, DevOps/Tech Lead chạy lệnh `npm audit` để phát hiện và vá các lỗ hổng bảo mật của thư viện. Sử dụng công cụ `npm-check-updates` (`ncu`) để rà soát phiên bản mới trước khi nâng cấp hàng loạt.

#### 2.8 Quy chuẩn Cú pháp Angular mới nhất (Angular Modern Syntaxes)
Để đảm bảo tối ưu hóa hiệu năng, tính tương thích dài hạn và dễ bảo trì, toàn bộ mã nguồn Angular trong dự án Web và Mobile bắt buộc sử dụng các cú pháp mới nhất từ Angular 17/18/19:
* **Sử dụng Block Control Flow mới:**
  Tuyệt đối không sử dụng các structural directives cũ như `*ngIf`, `*ngFor`, `*ngSwitch`. Thay vào đó, bắt buộc sử dụng cú pháp dạng block tích hợp:
  - `@if (condition) { ... } @else { ... }`
  - `@for (item of items; track item.id) { ... } @empty { ... }` (Bắt buộc phải có mệnh đề `track` để tối ưu DOM update).
  - `@switch (value) { @case (val1) { ... } @default { ... } }`
* **Sử dụng Signal APIs cho Inputs, Outputs và State:**
  - Thay thế `@Input()` bằng hàm **`input()`** hoặc **`input.required()`** để nhận thuộc tính reactive.
  - Thay thế `@Output()` bằng hàm **`output()`** để bắn sự kiện ra ngoài.
  - Sử dụng **`model()`** cho các luồng hai chiều (two-way data binding).
  - Sử dụng **`computed()`** để tự động tính toán các giá trị phái sinh và **`effect()`** để xử lý các side-effects reactive.
* **Standalone Components:** Mặc định tất cả các components, directives, pipes mới đều phải khai báo dạng standalone (`standalone: true`) và import trực tiếp các module/component phụ thuộc vào mảng `imports`.

#### 2.9 Quy chuẩn Cú pháp NestJS mới nhất (NestJS Modern Syntaxes)
* **TypeScript Strict Mode:** Bắt buộc bật cấu hình `"strict": true` trong `tsconfig.json`. Cấm tuyệt đối ép kiểu `any` mà không có lý do chính đáng. Sử dụng `unknown` hoặc viết custom interfaces/types.
* **NestJS ClsModule (AsyncLocalStorage):** Sử dụng `ClsService` của thư viện `nestjs-cls` (hoặc `AsyncLocalStorage` gốc) để lưu trữ context an toàn của mỗi request (Tenant ID, User ID, Transaction context) thay vì gán trực tiếp vào request object, giúp tránh rò rỉ bộ nhớ và dễ dàng truy cập context ở bất kỳ lớp service nào mà không cần truyền tham số qua nhiều tầng.
* **Strict Dependency Injection:** Sử dụng decorator `@Inject()` kết hợp với token rõ ràng cho các custom providers. Tận dụng cơ chế config module định nghĩa kiểu chặt chẽ (Typed ConfigService).

#### 2.10 Quy chuẩn sử dụng Icons (Feather Icons)
Để duy trì tính thống nhất về giao diện và tối ưu hóa hiệu năng render, toàn bộ các icon trong dự án bắt buộc phải sử dụng bộ icon **Feather Icons**:
* **Không sử dụng inline SVG thô:** Cấm tuyệt đối việc sử dụng code SVG nội tuyến (`<svg>...</svg>`) cứng cho các icon chuẩn trong template.
* **Sử dụng component dùng chung:** Phải sử dụng component `<oerp-icon>` từ thư viện `@open-erp/shared-ui`.
* **Cú pháp khai báo:**
  - Ví dụ: `<oerp-icon name="icon-name" [size]="16" color="currentColor"></oerp-icon>`
  - Thuộc tính `name` nhận đúng tên icon của Feather (ví dụ: `chevron-down`, `x`, `check-circle`, `alert-triangle`, `alert-octagon`, `info`, `chevron-left`, `chevron-right`).

#### 2.11 Nguyên tắc dự án thiết yếu (Core Project Principles)
Mọi hoạt động phát triển, nâng cấp công nghệ và xử lý i18n phải tuân thủ nghiêm ngặt theo các nguyên tắc được định nghĩa trong [project_principles.md](../../project_principles.md):
* Sử dụng các phiên bản công nghệ mới nhất: NestJS 11, Angular 22, Tailwind CSS 4, Transloco 8.
* Backend chỉ trả về mã lỗi (`errorCode`) và key thông điệp (`messageKey`). Việc biên dịch ngôn ngữ hiển thị do Frontend đảm nhiệm thông qua Transloco.
* Luôn tuân thủ quy trình làm việc chuẩn (Workflow): Đọc tài liệu -> Cập nhật tài liệu -> Code -> Test local -> Đồng bộ cập nhật kết quả vào `task.md` & `walkthrough.md`.

---

### 3. Thiết lập Môi trường Phát triển & Gỡ lỗi cục bộ (VSCode & Local Dev)

#### 3.1 Quy trình phát triển cục bộ cho Developer (Local Development Loop)
* **Quy tắc quan trọng:** Để tối ưu hóa hiệu năng máy cá nhân và hỗ trợ debug sâu, lập trình viên **không chạy runtime của Backend/Frontend bên trong Docker** trong môi trường dev. Thay vào đó:
  1. Sử dụng **Docker Desktop (hoặc Docker Engine trên WSL)** để khởi chạy các dịch vụ hạ tầng phụ trợ (Database PostgreSQL RLS, Redis Cache).
  2. Chạy runtime của NestJS, Angular, và Ionic trực tiếp trên máy host vật lý bằng cách sử dụng Node.js/npm.
  3. Lập trình viên sử dụng **VSCode Debugger** để đính kèm (attach) hoặc khởi chạy (launch) tiến trình gỡ lỗi trực tiếp trên IDE.

#### 3.2 Cấu hình Docker Compose cho hạ tầng local (`docker-compose.local.yml`)
Đặt tại thư mục root để khởi tạo nhanh DB và Cache:
```yaml
version: '3.8'
services:
  postgres-dev:
    image: postgres:16-alpine
    container_name: open-erp-postgres-local
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB: open_erp_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_local_data:/var/lib/postgresql/data

  redis-dev:
    image: redis:7-alpine
    container_name: open-erp-redis-local
    ports:
      - "6379:6379"

volumes:
  postgres_local_data:
```

#### 3.3 Cấu hình VSCode Debugging (`.vscode/launch.json` cho backend NestJS)
Giúp developer đặt Breakpoint để gỡ lỗi trực tiếp trên code:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS Backend",
      "args": ["run", "start:dev"],
      "runtimeExecutable": "npm",
      "cwd": "${workspaceFolder}/open-erp-services",
      "protocol": "inspector",
      "console": "integratedTerminal",
      "restart": true,
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://postgres:localpassword@localhost:5432/open_erp_dev"
      }
    }
  ]
}
```

---

### 4. Quy chuẩn liên kết và đường dẫn file trên GitHub (GitHub Path Rules)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC KHI VIẾT ĐƯỜNG DẪN TÀI LIỆU TRÊN GITHUB (PHẢI TUÂN THỦ NGHIÊM NGẶT):**
> 
> 1. **Sử dụng đường dẫn tương đối (Relative Paths):** Tất cả các tài liệu phải liên kết qua cấu trúc tương đối (ví dụ: `[Mô hình dữ liệu](../04_technical/data_model.md)` hoặc `[Task 03](./task_03_architecture_design.md)`). Tuyệt đối KHÔNG sử dụng đường dẫn tuyệt đối dạng Windows (`C:\...`) hoặc dạng URL file cục bộ (`file:///...`).
> 2. **Phân biệt chữ hoa/thường (Case Sensitivity):** GitHub chạy trên nền tảng hệ điều hành Linux nên phân biệt chữ hoa và chữ thường trong đường dẫn. Toàn bộ tên thư mục và tên file trong liên kết phải khớp chính xác 100% với tên thực tế trên ổ đĩa (ví dụ: `task_01_discovery_scope.md` chứ không được viết thành `Task_01_discovery_scope.md`).
> 3. **Ký tự ngăn cách:** Luôn sử dụng dấu gạch chéo `/` thay cho dấu gạch chéo ngược `\` của Windows.

---

### 5. Công việc chi tiết của BE & FE Leads
* **Bước 1:** Khởi tạo khung boilerplate cho cả 3 repository gốc và dự án thư viện chung `open-erp-ui` dạng Angular Library.
* **Bước 2:** Cài đặt các file cấu hình `.eslintrc.js`, `.prettierrc` chung, cấu hình script gỡ lỗi `.vscode/launch.json` và file `docker-compose.local.yml` chạy hạ tầng.
* **Bước 3:** Cấu hình Tailwind CSS cho `open-erp-web` và thư viện giao diện chung với theme màu `rose-gold` và tùy chọn `darkMode: 'class'`. Tích hợp biến CSS tương tự vào Ionic `variables.css`.
* **Bước 4:** Thực hiện liên kết thư viện bằng cách cập nhật cấu hình file config tsconfig ở Web/Mobile và chạy lệnh `npm link` thử nghiệm.

---

### 6. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Cấu trúc thư mục của 3 dự án và 1 thư viện UI dùng chung được đẩy lên Git.
  - Chạy `docker compose -f docker-compose.local.yml up -d` khởi chạy thành công Postgres và Redis local.
  - Chạy debug trên VSCode hoạt động bình thường, có thể dừng breakpoint để kiểm tra biến.
  - Toàn bộ liên kết trong tài liệu sử dụng relative path hoạt động tốt trên giao diện GitHub (không bị lỗi 404 do sai hoa/thường hoặc sai đường dẫn).
  - Web và Mobile biên dịch thành công có thể hiển thị màu Hồng Vàng (`rose-gold`) ở cả 2 chế độ Dark & Light mode.
