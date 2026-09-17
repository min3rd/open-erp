.PHONY: help infra infra-minimal infra-kafka infra-mongo infra-storage infra-mail infra-full infra-down backend web mobile dev build-images deploy-staging deploy-prod

help:
	@echo "Open-ERP CLI & Development Automation"
	@echo "======================================"
	@echo "make infra          - Khoi dong ha tang TOI THIEU (Postgres Primary + Redis, ~300MB RAM)"
	@echo "make infra-kafka    - Khoi dong toi thieu + Apache Kafka & Kafka UI"
	@echo "make infra-mongo    - Khoi dong toi thieu + MongoDB Replica-Set"
	@echo "make infra-storage  - Khoi dong toi thieu + MinIO S3 Object Storage"
	@echo "make infra-mail     - Khoi dong toi thieu + Mailpit SMTP"
	@echo "make infra-full     - Khoi dong TOAN BO cac dich vu (yeu cau RAM >= 8GB)"
	@echo "make infra-down     - Dung toan bo containers ha tang Docker"
	@echo "make backend        - Chay Quarkus Java Backend Dev Mode (Live coding port 8088)"
	@echo "make web            - Chay Angular 22 Web Desktop Dev Server (port 4200)"
	@echo "make mobile         - Chay Ionic 8 Mobile App Dev Server (port 8100)"
	@echo "make dev            - Khoi dong ha tang toi thieu va huong dan chay app"
	@echo "make build-images   - Dong goi Docker images cho Backend va Web"
	@echo "make deploy-staging - Trien khai len moi truong Staging (Docker / K8s)"
	@echo "make deploy-prod    - Trien khai len moi truong Production (Kubernetes)"

# Mặc định: Chạy hạ tầng tối thiểu (Postgres Primary + Redis) tiết kiệm RAM
infra:
	@echo "Starting MINIMAL infrastructure (PostgreSQL Primary + Redis)..."
	docker compose up -d

infra-minimal: infra

infra-kafka:
	@echo "Starting MINIMAL + Apache Kafka & Kafka UI..."
	docker compose --profile kafka up -d

infra-mongo:
	@echo "Starting MINIMAL + MongoDB Replica-Set..."
	docker compose --profile mongo up -d

infra-storage:
	@echo "Starting MINIMAL + MinIO Object Storage..."
	docker compose --profile storage up -d

infra-mail:
	@echo "Starting MINIMAL + Mailpit SMTP..."
	docker compose --profile mail up -d

infra-full:
	@echo "Starting FULL infrastructure (All services, requires ~6-8GB RAM)..."
	docker compose --profile full up -d

infra-down:
	@echo "Stopping all Docker infrastructure..."
	docker compose down

backend:
	@echo "Starting Quarkus Backend in Dev Mode (Java 21+)..."
	./scripts/dev/run_backend.sh

web:
	@echo "Starting Angular 22 Web Dev Server..."
	./scripts/dev/run_web.sh

mobile:
	@echo "Starting Ionic 8 Mobile Dev Server..."
	./scripts/dev/run_mobile.sh

dev: infra
	@echo "Minimal infrastructure ready. Starting applications..."

build-images:
	./scripts/deploy/build_images.sh

deploy-staging:
	./scripts/deploy/deploy_docker.sh

deploy-prod:
	./scripts/deploy/deploy_k8s.sh
