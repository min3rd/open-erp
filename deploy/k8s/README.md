# Kubernetes Deploy Assets

## Thành phần

- `base/namespace.yaml`: namespace chung `open-erp`.
- `base/configmap-app.yaml`: cấu hình không nhạy cảm.
- `base/secret-app.template.yaml`: template secret, không chứa giá trị thật.
- `base/deployment-api-gateway.yaml`: deployment có resource limits + probes.
- `base/service-api-gateway.yaml`: service nội bộ.
- `base/ingress-api-gateway.yaml`: ingress public với TLS.
- `base/network-policy.yaml`: baseline kiểm soát traffic ingress.
- `base/kustomization.yaml`: gom manifest theo chuẩn kustomize.

## Triển khai staging

```bash
kubectl apply -k deploy/k8s/base
```

## Kiểm tra sau deploy

```bash
kubectl get pods -n open-erp
kubectl get svc -n open-erp
kubectl get ingress -n open-erp
kubectl rollout status deploy/api-gateway -n open-erp
```

## Rollback cơ bản

```bash
kubectl rollout history deploy/api-gateway -n open-erp
kubectl rollout undo deploy/api-gateway -n open-erp
```
