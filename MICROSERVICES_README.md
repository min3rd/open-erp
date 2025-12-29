# Open ERP Microservices Architecture

This repository implements a microservices architecture for the Open ERP system using NestJS, RabbitMQ, and comprehensive observability tools.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Microservices](#microservices)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Observability](#observability)
- [Security](#security)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The system is composed of the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer              │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │  Auth   │         │  Order  │         │Inventory│
    │ Service │         │ Service │         │ Service │
    └────┬────┘         └────┬────┘         └────┬────┘
         │                   │                    │
         └───────────────────┼────────────────────┘
                             │
                      ┌──────▼──────┐
                      │  RabbitMQ   │
                      │   Broker    │
                      └─────────────┘
```

### Communication Patterns

- **Event-Driven (Pub/Sub)**: Order creation triggers inventory updates
- **RPC**: Token validation between services
- **Dead Letter Exchange**: Failed message handling with retry logic

## 🔧 Microservices

### 1. Auth Service (Port 3001)
- User authentication and authorization
- JWT token generation and validation
- RPC endpoint for token validation
- Event publishing for user actions

### 2. Order Service (Port 3004) - Publisher Example
- Order management and creation
- Publishes `order.created` events to RabbitMQ
- Demonstrates event publishing pattern

### 3. Inventory Service (Port 3005) - Consumer Example
- Inventory tracking and management
- Consumes `order.created` events from RabbitMQ
- Demonstrates event consumption with retry logic
- Automatic inventory reservation on order creation

### 4. Shared RabbitMQ Client Library
- Centralized message broker client
- Built-in retry logic with exponential backoff
- Idempotency handling
- Dead letter exchange support
- Structured logging

## 📦 Prerequisites

- **Docker & Docker Compose**: v20.10+
- **Node.js**: v20+ (for local development)
- **Kubernetes**: v1.24+ (for production deployment)
- **kubectl**: Latest version
- **Helm**: v3.0+ (optional, for Helm deployments)

## 🚀 Quick Start

### Using Docker Compose (Recommended for Local Development)

1. **Clone the repository**
```bash
git clone https://github.com/min3rd/open-erp.git
cd open-erp
```

2. **Copy environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Verify services are running**
```bash
docker-compose ps
```

5. **Access the services**
- RabbitMQ Management UI: http://localhost:15672 (admin/admin123)
- Auth Service: http://localhost:3001
- Order Service: http://localhost:3004
- Inventory Service: http://localhost:3005
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- Jaeger UI: http://localhost:16686

### Testing the System

**Example 1: Create a user and login**
```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Example 2: Create an order (Publisher)**
```bash
# Create an order - this will publish an event to RabbitMQ
curl -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "PROD001",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98
  }'
```

**Example 3: Check inventory (Consumer)**
```bash
# Get inventory for a product
curl http://localhost:3005/inventory/PROD001

# List all inventory
curl http://localhost:3005/inventory
```

**Expected Result**: When you create an order, the inventory service will automatically receive the event and reserve the inventory. Check the logs:

```bash
# Watch order service logs
docker-compose logs -f order-service

# Watch inventory service logs
docker-compose logs -f inventory-service
```

## 💻 Development

### Local Development Setup

1. **Install dependencies for each service**
```bash
# Install shared RabbitMQ client
cd microservices/shared/rabbitmq-client
npm install
npm run build

# Install auth service
cd ../auth-service
npm install

# Install order service
cd ../order-service
npm install

# Install inventory service
cd ../inventory-service
npm install
```

2. **Start RabbitMQ locally**
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3.12-management-alpine
```

3. **Run services in development mode**
```bash
# Terminal 1 - Auth Service
cd microservices/auth-service
npm run start:dev

# Terminal 2 - Order Service
cd microservices/order-service
npm run start:dev

# Terminal 3 - Inventory Service
cd microservices/inventory-service
npm run start:dev
```

### Adding a New Microservice

1. Copy the structure from an existing service
2. Update `package.json` with service name and description
3. Implement your service logic
4. Create a Dockerfile
5. Add service to `docker-compose.yml`
6. Create Kubernetes manifests in `k8s/base/`
7. Update documentation

## 🚢 Deployment

### Staging Deployment

1. **Build Docker images**
```bash
# Build all services
docker-compose build

# Tag images for registry
docker tag open-erp-auth-service:latest your-registry.com/open-erp/auth-service:staging
docker tag open-erp-order-service:latest your-registry.com/open-erp/order-service:staging
docker tag open-erp-inventory-service:latest your-registry.com/open-erp/inventory-service:staging
```

2. **Push to container registry**
```bash
docker push your-registry.com/open-erp/auth-service:staging
docker push your-registry.com/open-erp/order-service:staging
docker push your-registry.com/open-erp/inventory-service:staging
```

3. **Deploy to Kubernetes**
```bash
# Apply base manifests
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/secrets.yaml
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/rabbitmq.yaml

# Wait for RabbitMQ to be ready
kubectl wait --for=condition=ready pod -l app=rabbitmq -n open-erp --timeout=300s

# Deploy services
kubectl apply -f k8s/base/auth-service.yaml
kubectl apply -f k8s/base/order-service.yaml
kubectl apply -f k8s/base/inventory-service.yaml
```

4. **Verify deployment**
```bash
# Check pod status
kubectl get pods -n open-erp

# Check service endpoints
kubectl get svc -n open-erp

# View logs
kubectl logs -f deployment/auth-service -n open-erp
```

### Production Deployment

1. **Update secrets**
```bash
# Create production secrets
kubectl create secret generic rabbitmq-secret \
  --from-literal=rabbitmq-user=prod-user \
  --from-literal=rabbitmq-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  -n open-erp
```

2. **Update image tags to production versions**
```bash
# Update deployments with production images
kubectl set image deployment/auth-service \
  auth-service=your-registry.com/open-erp/auth-service:v1.0.0 \
  -n open-erp

kubectl set image deployment/order-service \
  order-service=your-registry.com/open-erp/order-service:v1.0.0 \
  -n open-erp

kubectl set image deployment/inventory-service \
  inventory-service=your-registry.com/open-erp/inventory-service:v1.0.0 \
  -n open-erp
```

3. **Enable TLS for RabbitMQ**
- See [RabbitMQ TLS Configuration](docs/rabbitmq-tls.md)

### Rollback

```bash
# Rollback a deployment
kubectl rollout undo deployment/auth-service -n open-erp

# Check rollout status
kubectl rollout status deployment/auth-service -n open-erp

# View rollout history
kubectl rollout history deployment/auth-service -n open-erp
```

## 📊 Observability

### Logging

All services use structured JSON logging with Winston:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Order created and event published",
  "service": "order-service",
  "orderId": "ORD_123456",
  "userId": "user_789"
}
```

**View logs:**
```bash
# Docker Compose
docker-compose logs -f order-service

# Kubernetes
kubectl logs -f deployment/order-service -n open-erp
```

### Metrics (Prometheus)

Each service exposes Prometheus metrics at `/[service]/metrics`.

**Key Metrics:**
- `order_create_success_total` - Total successful order creations
- `inventory_order_events_processed_total` - Total order events processed
- `auth_login_attempts_total` - Total login attempts

Access Prometheus: http://localhost:9090

### Dashboards (Grafana)

Pre-configured dashboards available at http://localhost:3000

**Default Dashboards:**
- Microservices Overview
- RabbitMQ Metrics
- Service Health

### Distributed Tracing (Jaeger)

View distributed traces at http://localhost:16686

Traces show the complete journey of requests across services.

## 🔒 Security

### RabbitMQ Security

1. **Change Default Credentials**
```bash
# Update .env file
RABBITMQ_USER=your-secure-username
RABBITMQ_PASSWORD=your-secure-password
```

2. **Enable TLS** (Production)
```bash
# Update .env file
RABBITMQ_ENABLE_TLS=true

# Mount TLS certificates in docker-compose.yml
volumes:
  - ./certs/rabbitmq-cert.pem:/etc/rabbitmq/cert.pem:ro
  - ./certs/rabbitmq-key.pem:/etc/rabbitmq/key.pem:ro
  - ./certs/ca-cert.pem:/etc/rabbitmq/ca.pem:ro
```

### Kubernetes RBAC

Service accounts with minimal permissions:

```bash
kubectl apply -f k8s/base/rbac.yaml
```

### Secrets Management

**Using Kubernetes Secrets:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  -n open-erp
```

**Using HashiCorp Vault:** (Recommended for production)
- See [Vault Integration Guide](docs/vault-integration.md)

## 🧪 Testing

### Acceptance Criteria Checklist

- [x] `docker-compose up` successfully starts RabbitMQ
- [x] All services connect to RabbitMQ on startup
- [x] Creating an order publishes event to RabbitMQ
- [x] Inventory service receives and processes order events
- [x] Failed messages are routed to Dead Letter Exchange
- [x] Retry logic works with exponential backoff
- [x] Health checks pass for all services
- [x] Metrics are exposed and scrapable by Prometheus
- [x] Structured logs are output in JSON format
- [x] Services can be deployed to Kubernetes

### Manual Testing

**Test Event Flow:**
```bash
# 1. Create an order
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [{"productId": "PROD001", "quantity": 2, "price": 99.99}],
    "totalAmount": 199.98
  }')

echo $ORDER_RESPONSE

# 2. Wait 2 seconds for event processing
sleep 2

# 3. Check inventory was updated
curl http://localhost:3005/inventory/PROD001

# 4. Verify in RabbitMQ UI
# Go to http://localhost:15672 and check queues
```

## 🐛 Troubleshooting

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Test connection
curl -u admin:admin123 http://localhost:15672/api/overview
```

### Service Not Receiving Events

```bash
# Check queue bindings in RabbitMQ UI
# Check service logs for connection errors
docker-compose logs inventory-service

# Verify exchange and queue setup
docker-compose exec rabbitmq rabbitmqctl list_exchanges
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose exec rabbitmq rabbitmqctl list_bindings
```

### High Memory Usage

```bash
# Check RabbitMQ memory
docker stats open-erp-rabbitmq

# Adjust memory limits in docker-compose.yml
# Or configure RabbitMQ memory threshold
```

## 📚 Additional Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com)

## 📝 License

[Your License Here]

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
