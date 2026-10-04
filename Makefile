.PHONY: help infra infra-kafka infra-mongo infra-storage infra-mail infra-full infra-down backend web mobile build-images deploy-staging deploy-prod

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
	@echo "make build-images   - Dong goi Docker images cho Backend va Web"
	@echo "make deploy-staging - Trien khai len moi truong Staging (Docker Compose)"
	@echo "make deploy-prod    - Trien khai len Kubernetes"

# Mặc định: Chạy hạ tầng tối thiểu (Postgres Primary + Redis) tiết kiệm RAM
infra:
	node scripts/run.mjs infra

infra-kafka:
	node scripts/run.mjs infra kafka

infra-mongo:
	node scripts/run.mjs infra mongo

infra-storage:
	node scripts/run.mjs infra storage

infra-mail:
	node scripts/run.mjs infra mail

infra-full:
	node scripts/run.mjs infra full

infra-down:
	node scripts/run.mjs infra-down

backend:
	node scripts/run.mjs backend

web:
	node scripts/run.mjs web

mobile:
	node scripts/run.mjs mobile

build-images:
	node scripts/run.mjs build-images

deploy-staging:
	node scripts/run.mjs deploy-docker

deploy-prod:
	node scripts/run.mjs deploy-k8s
