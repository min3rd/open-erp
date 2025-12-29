# Deployment Guide

This guide covers deployment strategies for Open ERP microservices in different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Deployment](#development-deployment)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)

## Prerequisites

### Required Tools

- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Kubernetes**: v1.24+
- **kubectl**: Latest version
- **Helm**: v3.8+
- **Container Registry**: Docker Hub, AWS ECR, GCR, or Azure ACR

### Required Access

- Container registry credentials
- Kubernetes cluster access
- Secret management system access (Vault, AWS Secrets Manager, etc.)

## Development Deployment

### Using Docker Compose

1. **Clone and setup**
```bash
git clone https://github.com/min3rd/open-erp.git
cd open-erp
cp .env.example .env
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Verify deployment**
```bash
# Check all services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:3001/auth/health
curl http://localhost:3004/orders/health
curl http://localhost:3005/inventory/health
```

4. **Stop services**
```bash
docker-compose down
# or keep volumes
docker-compose down -v
```

## Staging Deployment

### Using Kubernetes with kubectl

1. **Build and push images**
```bash
# Set your registry
export REGISTRY=your-registry.com/open-erp

# Build all services
cd microservices/auth-service
docker build -t $REGISTRY/auth-service:staging .

cd ../order-service
docker build -t $REGISTRY/order-service:staging .

cd ../inventory-service
docker build -t $REGISTRY/inventory-service:staging .

# Push to registry
docker push $REGISTRY/auth-service:staging
docker push $REGISTRY/order-service:staging
docker push $REGISTRY/inventory-service:staging
```

2. **Create namespace and secrets**
```bash
# Create namespace
kubectl create namespace open-erp-staging

# Create secrets
kubectl create secret generic rabbitmq-secret \
  --from-literal=rabbitmq-user=staging-user \
  --from-literal=rabbitmq-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  -n open-erp-staging

# Verify secret
kubectl get secret rabbitmq-secret -n open-erp-staging
```

3. **Deploy RabbitMQ**
```bash
kubectl apply -f k8s/base/rabbitmq.yaml -n open-erp-staging

# Wait for RabbitMQ to be ready
kubectl wait --for=condition=ready pod -l app=rabbitmq \
  -n open-erp-staging --timeout=300s
```

4. **Update image references in manifests**
```bash
# Update k8s/base/auth-service.yaml
sed -i "s|image: open-erp/auth-service:latest|image: $REGISTRY/auth-service:staging|g" k8s/base/auth-service.yaml
sed -i "s|image: open-erp/order-service:latest|image: $REGISTRY/order-service:staging|g" k8s/base/order-service.yaml
sed -i "s|image: open-erp/inventory-service:latest|image: $REGISTRY/inventory-service:staging|g" k8s/base/inventory-service.yaml
```

5. **Deploy services**
```bash
kubectl apply -f k8s/base/configmap.yaml -n open-erp-staging
kubectl apply -f k8s/base/auth-service.yaml -n open-erp-staging
kubectl apply -f k8s/base/order-service.yaml -n open-erp-staging
kubectl apply -f k8s/base/inventory-service.yaml -n open-erp-staging
```

6. **Verify deployment**
```bash
# Check pods
kubectl get pods -n open-erp-staging

# Check services
kubectl get svc -n open-erp-staging

# View logs
kubectl logs -f deployment/auth-service -n open-erp-staging

# Port-forward to test
kubectl port-forward svc/auth-service 3001:3001 -n open-erp-staging
curl http://localhost:3001/auth/health
```

### Using Helm

1. **Install with Helm**
```bash
# Add custom values for staging
cat > values-staging.yaml <<EOF
global:
  env:
    nodeEnv: staging
    logLevel: debug

authService:
  replicaCount: 2
  image:
    repository: $REGISTRY/auth-service
    tag: staging

orderService:
  replicaCount: 2
  image:
    repository: $REGISTRY/order-service
    tag: staging

inventoryService:
  replicaCount: 2
  image:
    repository: $REGISTRY/inventory-service
    tag: staging
EOF

# Install
helm install open-erp-staging ./helm/open-erp-microservices \
  -f values-staging.yaml \
  --namespace open-erp-staging \
  --create-namespace
```

2. **Verify installation**
```bash
helm list -n open-erp-staging
helm status open-erp-staging -n open-erp-staging
```

3. **Upgrade**
```bash
helm upgrade open-erp-staging ./helm/open-erp-microservices \
  -f values-staging.yaml \
  --namespace open-erp-staging
```

## Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Database migrations ready
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] On-call team notified

### 1. Prepare Production Environment

```bash
# Create production namespace
kubectl create namespace open-erp-prod

# Create production secrets (use Vault or managed secrets)
kubectl create secret generic rabbitmq-secret \
  --from-literal=rabbitmq-user=prod-user \
  --from-literal=rabbitmq-password=$(vault read -field=password secret/rabbitmq/prod) \
  --from-literal=jwt-secret=$(vault read -field=secret secret/jwt/prod) \
  -n open-erp-prod
```

### 2. Build and Tag Production Images

```bash
export REGISTRY=your-registry.com/open-erp
export VERSION=v1.0.0

# Build with version tags
docker build -t $REGISTRY/auth-service:$VERSION microservices/auth-service/
docker build -t $REGISTRY/order-service:$VERSION microservices/order-service/
docker build -t $REGISTRY/inventory-service:$VERSION microservices/inventory-service/

# Tag as latest
docker tag $REGISTRY/auth-service:$VERSION $REGISTRY/auth-service:latest
docker tag $REGISTRY/order-service:$VERSION $REGISTRY/order-service:latest
docker tag $REGISTRY/inventory-service:$VERSION $REGISTRY/inventory-service:latest

# Push all tags
docker push $REGISTRY/auth-service:$VERSION
docker push $REGISTRY/auth-service:latest
docker push $REGISTRY/order-service:$VERSION
docker push $REGISTRY/order-service:latest
docker push $REGISTRY/inventory-service:$VERSION
docker push $REGISTRY/inventory-service:latest
```

### 3. Deploy with Helm (Recommended)

```bash
# Create production values
cat > values-production.yaml <<EOF
global:
  env:
    nodeEnv: production
    logLevel: info
    rabbitmqEnableTLS: "true"

replicaCount: 3

rabbitmq:
  persistence:
    enabled: true
    size: 20Gi
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 1000m

authService:
  replicaCount: 3
  image:
    repository: $REGISTRY/auth-service
    tag: $VERSION
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 1000m

orderService:
  replicaCount: 3
  image:
    repository: $REGISTRY/order-service
    tag: $VERSION
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 1000m

inventoryService:
  replicaCount: 3
  image:
    repository: $REGISTRY/inventory-service
    tag: $VERSION
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 1000m

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.open-erp.com
      paths:
        - path: /auth
          service: auth-service
          port: 3001
        - path: /orders
          service: order-service
          port: 3004
        - path: /inventory
          service: inventory-service
          port: 3005
  tls:
    - secretName: open-erp-tls
      hosts:
        - api.open-erp.com
EOF

# Install
helm install open-erp-prod ./helm/open-erp-microservices \
  -f values-production.yaml \
  --namespace open-erp-prod \
  --create-namespace \
  --wait \
  --timeout 10m
```

### 4. Enable Monitoring

```bash
# Deploy Prometheus ServiceMonitor
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: open-erp-services
  namespace: open-erp-prod
spec:
  selector:
    matchLabels:
      app.kubernetes.io/instance: open-erp-prod
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
EOF
```

### 5. Verify Production Deployment

```bash
# Check pods are running
kubectl get pods -n open-erp-prod

# Check pod readiness
kubectl get pods -n open-erp-prod -o wide

# Test health endpoints
kubectl run curl --image=curlimages/curl -it --rm -- \
  curl http://auth-service.open-erp-prod.svc.cluster.local:3001/auth/health

# Check metrics
kubectl run curl --image=curlimages/curl -it --rm -- \
  curl http://auth-service.open-erp-prod.svc.cluster.local:3001/auth/metrics
```

## Rollback Procedures

### Helm Rollback

```bash
# View release history
helm history open-erp-prod -n open-erp-prod

# Rollback to previous version
helm rollback open-erp-prod -n open-erp-prod

# Rollback to specific revision
helm rollback open-erp-prod 2 -n open-erp-prod

# Verify rollback
helm status open-erp-prod -n open-erp-prod
```

### kubectl Rollback

```bash
# View deployment history
kubectl rollout history deployment/auth-service -n open-erp-prod

# Rollback deployment
kubectl rollout undo deployment/auth-service -n open-erp-prod

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2 -n open-erp-prod

# Check rollout status
kubectl rollout status deployment/auth-service -n open-erp-prod

# Rollback all services
for service in auth-service order-service inventory-service; do
  kubectl rollout undo deployment/$service -n open-erp-prod
done
```

### Emergency Rollback

In case of critical issues:

```bash
# Scale down problematic service immediately
kubectl scale deployment/auth-service --replicas=0 -n open-erp-prod

# Restore previous working image
kubectl set image deployment/auth-service \
  auth-service=$REGISTRY/auth-service:v0.9.0 \
  -n open-erp-prod

# Scale back up
kubectl scale deployment/auth-service --replicas=3 -n open-erp-prod
```

## Monitoring & Health Checks

### Health Check Endpoints

All services expose health endpoints:
- `/auth/health` - Auth Service
- `/orders/health` - Order Service
- `/inventory/health` - Inventory Service

### Prometheus Metrics

Access metrics at:
- `/auth/metrics` - Auth Service metrics
- `/orders/metrics` - Order Service metrics
- `/inventory/metrics` - Inventory Service metrics

### Logging

```bash
# View logs for a service
kubectl logs -f deployment/auth-service -n open-erp-prod

# View logs from all pods
kubectl logs -f -l app=auth-service -n open-erp-prod

# View logs with timestamps
kubectl logs --timestamps=true deployment/auth-service -n open-erp-prod

# Export logs
kubectl logs deployment/auth-service -n open-erp-prod > auth-service.log
```

### Distributed Tracing

Access Jaeger UI to view distributed traces:
```bash
kubectl port-forward svc/jaeger 16686:16686 -n open-erp-prod
# Open http://localhost:16686
```

## Blue-Green Deployment

For zero-downtime deployments:

```bash
# Deploy new version alongside old
helm install open-erp-prod-green ./helm/open-erp-microservices \
  -f values-production.yaml \
  --set nameOverride=green \
  --namespace open-erp-prod

# Test green environment
kubectl port-forward svc/auth-service-green 3001:3001 -n open-erp-prod

# Switch traffic to green
kubectl patch service auth-service -n open-erp-prod \
  -p '{"spec":{"selector":{"version":"green"}}}'

# Remove blue environment
helm uninstall open-erp-prod-blue -n open-erp-prod
```

## Canary Deployment

Gradually roll out new version:

```bash
# Deploy canary with 10% traffic
helm upgrade open-erp-prod ./helm/open-erp-microservices \
  -f values-production.yaml \
  --set authService.canary.enabled=true \
  --set authService.canary.weight=10 \
  --namespace open-erp-prod

# Monitor metrics and errors
# If successful, increase traffic
helm upgrade open-erp-prod ./helm/open-erp-microservices \
  -f values-production.yaml \
  --set authService.canary.weight=50 \
  --namespace open-erp-prod

# Complete rollout
helm upgrade open-erp-prod ./helm/open-erp-microservices \
  -f values-production.yaml \
  --set authService.canary.enabled=false \
  --namespace open-erp-prod
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n open-erp-prod

# Check logs
kubectl logs <pod-name> -n open-erp-prod --previous

# Check resource limits
kubectl top pods -n open-erp-prod
```

### Service Unreachable

```bash
# Check service endpoints
kubectl get endpoints -n open-erp-prod

# Test from within cluster
kubectl run debug --image=nicolaka/netshoot -it --rm -- \
  curl http://auth-service:3001/auth/health
```

### High Error Rate

```bash
# Check application logs
kubectl logs -f deployment/auth-service -n open-erp-prod | grep ERROR

# Check RabbitMQ
kubectl exec -it rabbitmq-0 -n open-erp-prod -- rabbitmqctl list_queues

# Check metrics in Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n open-erp-prod
```

## Backup and Restore

### Backup RabbitMQ

```bash
# Backup definitions
kubectl exec -it rabbitmq-0 -n open-erp-prod -- \
  rabbitmqctl export_definitions /tmp/definitions.json

kubectl cp open-erp-prod/rabbitmq-0:/tmp/definitions.json ./rabbitmq-backup.json
```

### Restore RabbitMQ

```bash
kubectl cp ./rabbitmq-backup.json open-erp-prod/rabbitmq-0:/tmp/definitions.json

kubectl exec -it rabbitmq-0 -n open-erp-prod -- \
  rabbitmqctl import_definitions /tmp/definitions.json
```
