# Architecture Documentation

## System Architecture

The Open ERP microservices architecture follows modern cloud-native patterns with event-driven communication.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Load Balancer / Ingress                     │
│                         (HTTPS Termination)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
          ┌──────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
          │    Auth     │    │   Order    │    │ Inventory  │
          │   Service   │    │  Service   │    │  Service   │
          │   (3001)    │    │   (3004)   │    │   (3005)   │
          └──────┬──────┘    └─────┬──────┘    └─────┬──────┘
                 │                  │                  │
                 │         ┌────────┼────────┐        │
                 │         │        │        │        │
                 └─────────┼────────┼────────┼────────┘
                           │        │        │
                    ┌──────▼────────▼────────▼──────┐
                    │        RabbitMQ Broker        │
                    │   (Message Queue & Events)    │
                    │          (5672)               │
                    └───────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
  ┌──────▼──────┐          ┌───────▼────────┐        ┌───────▼────────┐
  │ Prometheus  │          │     Jaeger     │        │    Grafana     │
  │  (Metrics)  │          │   (Tracing)    │        │  (Dashboard)   │
  │   (9090)    │          │    (16686)     │        │    (3000)      │
  └─────────────┘          └────────────────┘        └────────────────┘
```

## Service Breakdown

### Auth Service
**Port:** 3001  
**Responsibilities:**
- User authentication and registration
- JWT token generation and validation
- RPC endpoint for token validation by other services
- Publishes authentication events

**Events Published:**
- `auth.user.login` - When user logs in
- `auth.user.registered` - When new user registers

**RPC Endpoints:**
- `validate_token` - Validates JWT tokens

### Order Service (Publisher Example)
**Port:** 3004  
**Responsibilities:**
- Order creation and management
- Order status tracking
- Publishes order events to RabbitMQ

**Events Published:**
- `order.created` - When new order is created
- `order.status.updated` - When order status changes

**REST Endpoints:**
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details
- `GET /orders` - List all orders

### Inventory Service (Consumer Example)
**Port:** 3005  
**Responsibilities:**
- Inventory tracking and management
- Listens for order events
- Automatically reserves inventory when orders are created

**Events Consumed:**
- `order.created` - Reserves inventory for the order

**REST Endpoints:**
- `GET /inventory/:productId` - Get inventory for product
- `GET /inventory` - List all inventory

## Communication Patterns

### 1. Event-Driven (Pub/Sub)

**Flow: Order Creation → Inventory Reservation**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Client    │         │    Order     │         │    RabbitMQ     │
│             │         │   Service    │         │                 │
└──────┬──────┘         └──────┬───────┘         └────────┬────────┘
       │                       │                          │
       │  POST /orders         │                          │
       │──────────────────────>│                          │
       │                       │                          │
       │                       │  publish(order.created)  │
       │                       │─────────────────────────>│
       │                       │                          │
       │  201 Created          │                          │
       │<──────────────────────│                          │
       │                       │                          │
                               │                          │
                               │                          │
┌─────────────────┐            │                          │
│   Inventory     │            │                          │
│   Service       │            │                          │
└────────┬────────┘            │                          │
         │                     │                          │
         │         consume(order.created)                 │
         │<───────────────────────────────────────────────│
         │                     │                          │
         │  Reserve inventory  │                          │
         │         ack()       │                          │
         │────────────────────────────────────────────────>│
         │                     │                          │
```

### 2. Request-Reply (RPC)

**Flow: Token Validation**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Service   │         │  RabbitMQ    │         │   Auth Service  │
│             │         │              │         │                 │
└──────┬──────┘         └──────┬───────┘         └────────┬────────┘
       │                       │                          │
       │  RPC: validate_token  │                          │
       │──────────────────────>│                          │
       │  (with reply_to)      │                          │
       │                       │  consume(validate_token) │
       │                       │─────────────────────────>│
       │                       │                          │
       │                       │                          │ Validate
       │                       │                          │ Token
       │                       │                          │
       │                       │  publish(reply_to)       │
       │                       │<─────────────────────────│
       │  Response             │                          │
       │<──────────────────────│                          │
       │                       │                          │
```

## RabbitMQ Configuration

### Exchanges

1. **auth.events** (Topic)
   - Type: topic
   - Durable: true
   - Routes: `auth.#`

2. **order.events** (Topic)
   - Type: topic
   - Durable: true
   - Routes: `order.#`

3. **auth.rpc** (Direct)
   - Type: direct
   - Durable: true
   - Routes: `validate.token`

4. **dlx.auth** (Topic)
   - Type: topic
   - Durable: true
   - Dead Letter Exchange for auth service

5. **dlx.order** (Topic)
   - Type: topic
   - Durable: true
   - Dead Letter Exchange for order service

6. **dlx.inventory** (Topic)
   - Type: topic
   - Durable: true
   - Dead Letter Exchange for inventory service

### Queues

1. **auth.events.queue**
   - Durable: true
   - Bound to: `auth.events`
   - DLX: `dlx.auth`

2. **auth.rpc.queue**
   - Durable: true
   - Bound to: `auth.rpc`
   - DLX: `dlx.auth`

3. **order.events.queue**
   - Durable: true
   - Bound to: `order.events`
   - DLX: `dlx.order`

4. **inventory.order-events.queue**
   - Durable: true
   - Bound to: `order.events` with routing key `order.created`
   - DLX: `dlx.inventory`

### Error Handling

**Retry Strategy with Exponential Backoff:**

```
1st attempt: immediate
2nd attempt: 1 second delay
3rd attempt: 2 second delay
4th attempt: 4 second delay
...
Max delay: 30 seconds
Max attempts: 3
```

**Dead Letter Exchange Flow:**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Message   │         │ Main Queue   │         │   DLX Queue     │
│             │         │              │         │                 │
└──────┬──────┘         └──────┬───────┘         └────────┬────────┘
       │                       │                          │
       │  Process attempt 1    │                          │
       │──────────────────────>│                          │
       │       NACK            │                          │
       │                       │                          │
       │  Process attempt 2    │                          │
       │──────────────────────>│                          │
       │       NACK            │                          │
       │                       │                          │
       │  Process attempt 3    │                          │
       │──────────────────────>│                          │
       │       NACK            │                          │
       │                       │                          │
       │                       │  Move to DLX             │
       │                       │─────────────────────────>│
       │                       │                          │
       │                       │                          │ Manual
       │                       │                          │ Review
```

## Data Flow Example

### Complete Order Flow

1. **Client creates order** → Order Service
2. **Order Service** validates request
3. **Order Service** persists order (status: pending)
4. **Order Service** publishes `order.created` event to RabbitMQ
5. **RabbitMQ** routes event to `inventory.order-events.queue`
6. **Inventory Service** consumes event
7. **Inventory Service** checks inventory availability
8. **Inventory Service** reserves inventory
9. **Inventory Service** acknowledges message
10. **Order Service** can poll order status or listen for inventory confirmation

## Observability

### Structured Logging

All services output JSON logs:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "service": "order-service",
  "message": "Order created and event published",
  "orderId": "ORD_123456",
  "userId": "user_789"
}
```

### Metrics

**Auth Service Metrics:**
- `auth_login_attempts_total` - Counter
- `auth_login_success_total` - Counter
- `auth_register_attempts_total` - Counter
- `auth_request_duration_seconds` - Histogram

**Order Service Metrics:**
- `order_create_attempts_total` - Counter
- `order_create_success_total` - Counter
- `order_get_requests_total` - Counter
- `order_request_duration_seconds` - Histogram

**Inventory Service Metrics:**
- `inventory_order_events_received_total` - Counter
- `inventory_order_events_processed_total` - Counter
- `inventory_order_events_failed_total` - Counter
- `inventory_order_processing_duration_seconds` - Histogram

### Distributed Tracing

OpenTelemetry traces show:
- Request entry point
- Service-to-service calls
- RabbitMQ publish/consume operations
- Database queries
- External API calls

## Scalability

### Horizontal Scaling

All services are stateless and can be scaled horizontally:

```bash
# Scale services
kubectl scale deployment/auth-service --replicas=5
kubectl scale deployment/order-service --replicas=5
kubectl scale deployment/inventory-service --replicas=5
```

### RabbitMQ Consumer Scaling

Multiple instances consume from the same queue with round-robin distribution:

```
┌─────────────┐
│  RabbitMQ   │
│   Queue     │
└──────┬──────┘
       │
   ┌───┼───┐
   │   │   │
   ▼   ▼   ▼
  ┌─┐ ┌─┐ ┌─┐
  │1│ │2│ │3│  Inventory Service Instances
  └─┘ └─┘ └─┘
```

## Security Layers

1. **Network Layer**
   - Network policies restrict pod-to-pod communication
   - TLS for all external communication

2. **Application Layer**
   - JWT authentication
   - Rate limiting
   - Input validation

3. **Infrastructure Layer**
   - RBAC for service accounts
   - Secrets management
   - Non-root containers

4. **Data Layer**
   - Encryption at rest
   - Encrypted message payloads
   - Secure credential storage

## Deployment Strategies

### Blue-Green Deployment

```
        ┌──────────────┐
        │ Load Balancer│
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │              │
   ┌────▼────┐    ┌────▼────┐
   │  Blue   │    │  Green  │
   │ (v1.0)  │    │ (v1.1)  │
   └─────────┘    └─────────┘
   
   Active         Testing
```

### Canary Deployment

```
        ┌──────────────┐
        │ Load Balancer│
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │              │
   ┌────▼────┐    ┌────▼────┐
   │ Stable  │    │ Canary  │
   │ (90%)   │    │  (10%)  │
   └─────────┘    └─────────┘
```

## Disaster Recovery

### Backup Strategy

1. **RabbitMQ State**: Daily snapshots of queue definitions
2. **Application State**: Database backups (if applicable)
3. **Configuration**: Git repository as source of truth

### Recovery Procedures

1. **RabbitMQ Failure**: Deploy from StatefulSet with persistent volume
2. **Service Failure**: Kubernetes automatically restarts failed pods
3. **Cluster Failure**: Multi-region deployment with failover

## Future Enhancements

1. **API Gateway**: Kong or Ambassador for unified API endpoint
2. **Service Mesh**: Istio for advanced traffic management
3. **Event Sourcing**: Complete audit trail of all events
4. **CQRS**: Separate read and write models
5. **GraphQL Federation**: Unified API across microservices
