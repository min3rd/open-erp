# Env Mapping Sprint 01

| Biến | Service sử dụng | Mục đích | Nguồn khuyến nghị |
|---|---|---|---|
| `IMAGE_TAG` | api-gateway | Chốt version image theo commit SHA | CI/CD variable |
| `API_GATEWAY_PORT` | api-gateway | Port publish service | Env file theo môi trường |
| `MONGO_URI` | api-gateway | Kết nối MongoDB | Secret manager |
| `RABBITMQ_URL` | api-gateway | Kết nối RabbitMQ | Secret manager |
| `REDIS_URL` | api-gateway | Kết nối Redis | Secret manager |
| `MONGO_INITDB_DATABASE` | mongodb | Init DB mặc định | Env file local |
| `RABBITMQ_USER` | rabbitmq | User RabbitMQ local | Env file local |
| `RABBITMQ_PASS` | rabbitmq | Password RabbitMQ local | Secret local/staging |
| `REDIS_PASSWORD` | redis | Password Redis local | Secret local/staging |
