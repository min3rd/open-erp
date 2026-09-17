#!/usr/bin/env bash
set -e

REGISTRY=${DOCKER_REGISTRY:-"openerp-registry.local"}
TAG=${IMAGE_TAG:-"latest"}

echo "==> Đóng gói Docker Images cho Open-ERP (Registry: $REGISTRY, Tag: $TAG)..."

echo "1. Building Quarkus Java Backend Image..."
docker build -f deployments/docker/Dockerfile.backend -t $REGISTRY/openerp-backend:$TAG .

echo "2. Building Angular 22 Web Frontend Image..."
docker build -f deployments/docker/Dockerfile.web -t $REGISTRY/openerp-web:$TAG .

echo "==> Hoàn thành đóng gói images thành công!"
