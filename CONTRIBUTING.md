# Contributing to Open ERP Microservices

Thank you for your interest in contributing to the Open ERP microservices project!

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/min3rd/open-erp.git
cd open-erp
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your local settings
```

3. **Start infrastructure**
```bash
docker-compose up -d rabbitmq prometheus grafana jaeger
```

4. **Install dependencies for a service**
```bash
cd microservices/auth-service
npm install
npm run start:dev
```

## Development Workflow

### Adding a New Feature

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Follow the existing code structure
- Add tests for new functionality
- Update documentation

3. **Test your changes**
```bash
# Run unit tests
npm test

# Run integration tests
./scripts/test-deployment.sh

# Check linting
npm run lint
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push and create pull request**
```bash
git push origin feature/your-feature-name
```

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add JWT refresh token support
fix(order): handle duplicate order creation
docs(readme): update deployment instructions
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over callbacks
- Add type annotations for function parameters and return values
- Use interfaces for object shapes

```typescript
// Good
interface CreateOrderDto {
  userId: string;
  items: OrderItem[];
  totalAmount: number;
}

async function createOrder(dto: CreateOrderDto): Promise<Order> {
  // Implementation
}

// Avoid
function createOrder(data: any) {
  // Implementation
}
```

### NestJS Best Practices

- Use dependency injection
- Separate business logic from controllers
- Use DTOs for request/response validation
- Implement proper error handling
- Add logging for important operations

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly rabbitMQClient: RabbitMQClient,
    private readonly loggerService: LoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    try {
      this.metricsService.incrementCounter('order_create_attempts_total');
      
      // Business logic
      const order = await this.saveOrder(dto);
      
      // Publish event
      await this.rabbitMQClient.publish('order.events', 'order.created', order);
      
      this.loggerService.log('Order created', { orderId: order.id });
      this.metricsService.incrementCounter('order_create_success_total');
      
      return order;
    } catch (error) {
      this.loggerService.error('Failed to create order', error);
      throw error;
    }
  }
}
```

### Logging Standards

Always use structured logging:

```typescript
// Good
this.logger.log('Order created', {
  orderId: order.id,
  userId: order.userId,
  totalAmount: order.totalAmount,
});

// Avoid
this.logger.log(`Order ${order.id} created for user ${order.userId}`);
```

### Metrics Standards

Add metrics for important operations:

```typescript
// Counter for attempts
this.metricsService.incrementCounter('operation_attempts_total');

// Counter for success
this.metricsService.incrementCounter('operation_success_total');

// Histogram for duration
const startTime = Date.now();
// ... operation ...
const duration = (Date.now() - startTime) / 1000;
this.metricsService.observeHistogram('operation_duration_seconds', duration);
```

## Testing

### Unit Tests

Write unit tests for all business logic:

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let rabbitMQClient: RabbitMQClient;

  beforeEach(() => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: RabbitMQClient,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    rabbitMQClient = module.get<RabbitMQClient>(RabbitMQClient);
  });

  it('should create an order', async () => {
    const dto = {
      userId: 'user123',
      items: [{ productId: 'PROD001', quantity: 2, price: 99.99 }],
      totalAmount: 199.98,
    };

    const result = await service.createOrder(dto);

    expect(result).toBeDefined();
    expect(result.userId).toBe(dto.userId);
    expect(rabbitMQClient.publish).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test the complete flow:

```typescript
describe('Order to Inventory Flow', () => {
  it('should reserve inventory when order is created', async () => {
    // Create order
    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId: 'user123',
        items: [{ productId: 'PROD001', quantity: 2, price: 99.99 }],
        totalAmount: 199.98,
      })
      .expect(201);

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check inventory was updated
    const inventoryResponse = await request(app.getHttpServer())
      .get('/inventory/PROD001')
      .expect(200);

    expect(inventoryResponse.body.reserved).toBeGreaterThan(0);
  });
});
```

## Adding a New Microservice

### 1. Create Service Structure

```bash
mkdir -p microservices/new-service/src
cd microservices/new-service
```

### 2. Copy Base Files

```bash
# Copy from existing service
cp ../order-service/package.json .
cp ../order-service/tsconfig.json .
cp ../order-service/nest-cli.json .
cp ../order-service/Dockerfile .
```

### 3. Update package.json

```json
{
  "name": "@open-erp/new-service",
  "description": "New Service Description"
}
```

### 4. Create Service Files

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.NEW_SERVICE_PORT || 3006;
  await app.listen(port);
}
bootstrap();

// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NewController } from './new.controller';
import { NewService } from './new.service';
import { RabbitMQClient } from '@open-erp/rabbitmq-client';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NewController],
  providers: [
    NewService,
    {
      provide: RabbitMQClient,
      useFactory: async () => {
        const client = new RabbitMQClient({
          url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
          user: process.env.RABBITMQ_USER || 'admin',
          password: process.env.RABBITMQ_PASSWORD || 'admin123',
        });
        await client.connect();
        return client;
      },
    },
  ],
})
export class AppModule {}
```

### 5. Add to docker-compose.yml

```yaml
new-service:
  build:
    context: ./microservices/new-service
    dockerfile: Dockerfile
  container_name: open-erp-new-service
  ports:
    - "3006:3006"
  environment:
    - NEW_SERVICE_PORT=3006
    - RABBITMQ_URL=amqp://rabbitmq:5672
    - RABBITMQ_USER=${RABBITMQ_USER:-admin}
    - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-admin123}
  depends_on:
    rabbitmq:
      condition: service_healthy
  networks:
    - microservices-network
```

### 6. Add Kubernetes Manifests

Create `k8s/base/new-service.yaml` following the pattern of existing services.

### 7. Update Helm Chart

Add to `helm/open-erp-microservices/values.yaml`:

```yaml
newService:
  enabled: true
  image:
    repository: open-erp/new-service
  port: 3006
  replicaCount: 2
```

## Documentation

### When to Update Documentation

- Adding new features
- Changing APIs
- Modifying deployment procedures
- Adding new environment variables
- Changing architecture

### Documentation Files

- `MICROSERVICES_README.md` - User-facing documentation
- `docs/ARCHITECTURE.md` - Architecture decisions
- `docs/DEPLOYMENT.md` - Deployment procedures
- `docs/SECURITY.md` - Security practices
- Code comments - For complex logic

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers
6. Address review comments
7. Squash commits if requested

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No new warnings
- [ ] Backward compatible (or breaking changes documented)
```

## Getting Help

- Open an issue for bugs or feature requests
- Ask questions in discussions
- Review existing documentation
- Check example implementations

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Open ERP Microservices! 🎉
