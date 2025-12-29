# Security Guide

This guide covers security best practices and configurations for Open ERP microservices.

## Table of Contents

- [RabbitMQ Security](#rabbitmq-security)
- [TLS Configuration](#tls-configuration)
- [Secrets Management](#secrets-management)
- [RBAC Configuration](#rbac-configuration)
- [Network Policies](#network-policies)
- [Security Scanning](#security-scanning)

## RabbitMQ Security

### Authentication

1. **Change Default Credentials**

Never use default credentials in production. Generate strong passwords:

```bash
# Generate secure password
export RABBITMQ_PASSWORD=$(openssl rand -base64 32)

# Create Kubernetes secret
kubectl create secret generic rabbitmq-secret \
  --from-literal=rabbitmq-user=prod-admin \
  --from-literal=rabbitmq-password=$RABBITMQ_PASSWORD \
  -n open-erp
```

2. **User Permissions**

Create users with minimal required permissions:

```bash
# Access RabbitMQ management
kubectl exec -it rabbitmq-0 -n open-erp -- bash

# Create application user
rabbitmqctl add_user app_user secure_password

# Set permissions for specific vhost
rabbitmqctl set_permissions -p / app_user ".*" ".*" ".*"

# Create read-only monitoring user
rabbitmqctl add_user monitor_user monitor_password
rabbitmqctl set_user_tags monitor_user monitoring
rabbitmqctl set_permissions -p / monitor_user "" "" ".*"
```

### Virtual Hosts (vhosts)

Isolate environments using vhosts:

```bash
# Create vhosts
rabbitmqctl add_vhost production
rabbitmqctl add_vhost staging

# Set permissions per vhost
rabbitmqctl set_permissions -p production app_user ".*" ".*" ".*"
rabbitmqctl set_permissions -p staging app_user ".*" ".*" ".*"
```

Update service configuration:

```yaml
# In ConfigMap
RABBITMQ_VHOST: "/production"
```

## TLS Configuration

### 1. Generate TLS Certificates

For production, use certificates from a trusted CA. For testing:

```bash
# Create CA
openssl req -new -x509 -days 365 -extensions v3_ca \
  -keyout ca-key.pem -out ca-cert.pem \
  -subj "/CN=Open-ERP-CA"

# Generate server certificate
openssl genrsa -out rabbitmq-key.pem 2048

openssl req -new -key rabbitmq-key.pem -out rabbitmq-req.pem \
  -subj "/CN=rabbitmq-service"

openssl x509 -req -in rabbitmq-req.pem -CA ca-cert.pem \
  -CAkey ca-key.pem -CAcreateserial -out rabbitmq-cert.pem \
  -days 365

# Generate client certificates
openssl genrsa -out client-key.pem 2048

openssl req -new -key client-key.pem -out client-req.pem \
  -subj "/CN=open-erp-client"

openssl x509 -req -in client-req.pem -CA ca-cert.pem \
  -CAkey ca-key.pem -CAcreateserial -out client-cert.pem \
  -days 365
```

### 2. Create Kubernetes TLS Secrets

```bash
# Server certificates
kubectl create secret generic rabbitmq-tls \
  --from-file=tls.crt=rabbitmq-cert.pem \
  --from-file=tls.key=rabbitmq-key.pem \
  --from-file=ca.crt=ca-cert.pem \
  -n open-erp

# Client certificates
kubectl create secret generic rabbitmq-client-tls \
  --from-file=tls.crt=client-cert.pem \
  --from-file=tls.key=client-key.pem \
  --from-file=ca.crt=ca-cert.pem \
  -n open-erp
```

### 3. Configure RabbitMQ for TLS

Create RabbitMQ config with TLS:

```erlang
# rabbitmq-tls.conf
listeners.ssl.default = 5671
ssl_options.cacertfile = /etc/rabbitmq/certs/ca.crt
ssl_options.certfile   = /etc/rabbitmq/certs/tls.crt
ssl_options.keyfile    = /etc/rabbitmq/certs/tls.key
ssl_options.verify     = verify_peer
ssl_options.fail_if_no_peer_cert = true

# Management plugin with TLS
management.ssl.port       = 15671
management.ssl.cacertfile = /etc/rabbitmq/certs/ca.crt
management.ssl.certfile   = /etc/rabbitmq/certs/tls.crt
management.ssl.keyfile    = /etc/rabbitmq/certs/tls.key
```

Update StatefulSet to mount certificates:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
spec:
  template:
    spec:
      containers:
      - name: rabbitmq
        volumeMounts:
        - name: tls-certs
          mountPath: /etc/rabbitmq/certs
          readOnly: true
        - name: config
          mountPath: /etc/rabbitmq/rabbitmq.conf
          subPath: rabbitmq.conf
      volumes:
      - name: tls-certs
        secret:
          secretName: rabbitmq-tls
      - name: config
        configMap:
          name: rabbitmq-config
```

### 4. Update Services for TLS

Update environment variables:

```yaml
# In service deployments
env:
- name: RABBITMQ_URL
  value: "amqps://rabbitmq-service:5671"
- name: RABBITMQ_ENABLE_TLS
  value: "true"
- name: RABBITMQ_CA_CERT
  value: "/etc/certs/ca.crt"
- name: RABBITMQ_CLIENT_CERT
  value: "/etc/certs/tls.crt"
- name: RABBITMQ_CLIENT_KEY
  value: "/etc/certs/tls.key"

volumeMounts:
- name: client-certs
  mountPath: /etc/certs
  readOnly: true

volumes:
- name: client-certs
  secret:
    secretName: rabbitmq-client-tls
```

## Secrets Management

### Kubernetes Secrets

Basic secret creation:

```bash
# Create from literals
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  --from-literal=database-password=$(openssl rand -base64 32) \
  -n open-erp

# Create from files
kubectl create secret generic tls-secrets \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem \
  -n open-erp
```

### HashiCorp Vault Integration

1. **Install Vault Agent Injector**

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --set "injector.enabled=true" \
  --namespace vault \
  --create-namespace
```

2. **Configure Vault Policy**

```bash
# Create policy
vault policy write open-erp-policy - <<EOF
path "secret/data/open-erp/*" {
  capabilities = ["read"]
}
EOF

# Enable Kubernetes auth
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443"

# Create role
vault write auth/kubernetes/role/open-erp \
  bound_service_account_names=open-erp-sa \
  bound_service_account_namespaces=open-erp \
  policies=open-erp-policy \
  ttl=24h
```

3. **Annotate Deployments for Vault Injection**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "open-erp"
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/open-erp/auth"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "secret/data/open-erp/auth" -}}
          export JWT_SECRET="{{ .Data.data.jwt_secret }}"
          export RABBITMQ_PASSWORD="{{ .Data.data.rabbitmq_password }}"
          {{- end }}
```

### AWS Secrets Manager

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace

# Create SecretStore
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretsmanager
  namespace: open-erp
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
EOF

# Create ExternalSecret
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: open-erp-secrets
  namespace: open-erp
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: jwt-secret
    remoteRef:
      key: open-erp/jwt-secret
  - secretKey: rabbitmq-password
    remoteRef:
      key: open-erp/rabbitmq-password
EOF
```

## RBAC Configuration

### Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: open-erp-sa
  namespace: open-erp
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: open-erp-role
  namespace: open-erp
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: open-erp-rolebinding
  namespace: open-erp
subjects:
- kind: ServiceAccount
  name: open-erp-sa
  namespace: open-erp
roleRef:
  kind: Role
  name: open-erp-role
  apiGroup: rbac.authorization.k8s.io
```

Apply to deployments:

```yaml
spec:
  template:
    spec:
      serviceAccountName: open-erp-sa
```

## Network Policies

Restrict network traffic between services:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: rabbitmq-network-policy
  namespace: open-erp
spec:
  podSelector:
    matchLabels:
      app: rabbitmq
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: auth-service
    - podSelector:
        matchLabels:
          app: order-service
    - podSelector:
        matchLabels:
          app: inventory-service
    ports:
    - protocol: TCP
      port: 5672
    - protocol: TCP
      port: 15672
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: open-erp
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

## Security Scanning

### Container Image Scanning

Using Trivy:

```bash
# Install Trivy
brew install aquasecurity/trivy/trivy

# Scan images
trivy image open-erp/auth-service:latest
trivy image open-erp/order-service:latest
trivy image open-erp/inventory-service:latest

# Scan with severity threshold
trivy image --severity HIGH,CRITICAL open-erp/auth-service:latest
```

### Kubernetes Security Scanning

Using kubesec:

```bash
# Install kubesec
brew install kubesec

# Scan manifests
kubesec scan k8s/base/auth-service.yaml
kubesec scan k8s/base/order-service.yaml
```

### Runtime Security

Using Falco:

```bash
# Install Falco
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace

# Create custom rules for Open ERP
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-rules
  namespace: falco
data:
  custom-rules.yaml: |
    - rule: Unauthorized RabbitMQ Access
      desc: Detect unauthorized access to RabbitMQ
      condition: >
        spawned_process and
        container.name = "rabbitmq" and
        not proc.name in (beam.smp, rabbitmqctl, erl)
      output: >
        Unauthorized process in RabbitMQ container
        (user=%user.name command=%proc.cmdline container=%container.name)
      priority: WARNING
EOF
```

## Security Checklist

Production deployment checklist:

- [ ] Changed all default credentials
- [ ] Enabled TLS for RabbitMQ
- [ ] Using strong, randomly generated secrets
- [ ] Secrets stored in Vault or managed secret service
- [ ] RBAC configured with minimal permissions
- [ ] Network policies in place
- [ ] Container images scanned for vulnerabilities
- [ ] Running containers as non-root user
- [ ] Read-only root filesystem where possible
- [ ] Resource limits set on all containers
- [ ] Security contexts configured
- [ ] Ingress configured with TLS
- [ ] API rate limiting enabled
- [ ] Audit logging enabled
- [ ] Regular security updates scheduled

## Compliance

### PCI DSS Considerations

- Encrypt data in transit (TLS)
- Encrypt data at rest (encrypted volumes)
- Access control (RBAC, network policies)
- Audit logging (centralized logging)
- Regular security assessments

### GDPR Considerations

- Data encryption
- Access controls
- Data retention policies
- Audit trails
- Right to be forgotten implementation

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor security alerts
   - Review audit logs
   - Check for anomalies

2. **Containment**
   ```bash
   # Immediately scale down affected service
   kubectl scale deployment/auth-service --replicas=0 -n open-erp
   
   # Block network access
   kubectl apply -f emergency-network-policy.yaml
   ```

3. **Investigation**
   ```bash
   # Collect logs
   kubectl logs deployment/auth-service -n open-erp > incident-logs.txt
   
   # Review audit logs
   kubectl get events -n open-erp
   ```

4. **Remediation**
   - Patch vulnerabilities
   - Rotate compromised credentials
   - Deploy fixed version

5. **Recovery**
   ```bash
   # Deploy patched version
   helm upgrade open-erp-prod ./helm/open-erp-microservices \
     --set authService.image.tag=v1.0.1-patched
   ```

## Resources

- [RabbitMQ Security](https://www.rabbitmq.com/security.html)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
