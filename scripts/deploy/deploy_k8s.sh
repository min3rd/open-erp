#!/usr/bin/env bash
set -e

ENVIRONMENT=${1:-"staging"}
echo "==> Triển khai hệ thống Open-ERP lên cụm Kubernetes (Overlay: $ENVIRONMENT)..."

if ! command -v kubectl &> /dev/null; then
    echo "Lỗi: Không tìm thấy lệnh kubectl. Vui lòng cài đặt kubectl!"
    exit 1
fi

kubectl apply -k deployments/k8s/overlays/$ENVIRONMENT

echo "==> Theo dõi trạng thái Rollout Deployments:"
kubectl rollout status deployment/openerp-backend -n openerp-$ENVIRONMENT --timeout=120s
kubectl rollout status deployment/openerp-web -n openerp-$ENVIRONMENT --timeout=120s

echo "==> Triển khai Kubernetes thành công!"
