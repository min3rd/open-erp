#!/bin/bash

# Test script for Open ERP Microservices
# This script validates the deployment and tests the event flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AUTH_SERVICE_URL=${AUTH_SERVICE_URL:-http://localhost:3001}
ORDER_SERVICE_URL=${ORDER_SERVICE_URL:-http://localhost:3004}
INVENTORY_SERVICE_URL=${INVENTORY_SERVICE_URL:-http://localhost:3005}
RABBITMQ_MGMT_URL=${RABBITMQ_MGMT_URL:-http://localhost:15672}
RABBITMQ_USER=${RABBITMQ_USER:-admin}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-admin123}

echo "======================================"
echo "Open ERP Microservices Test Suite"
echo "======================================"
echo ""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -n "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}Ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}Failed!${NC}"
    return 1
}

# Test 1: Check if RabbitMQ is running
echo "Test 1: Checking RabbitMQ..."
if curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD "$RABBITMQ_MGMT_URL/api/overview" > /dev/null 2>&1; then
    print_result 0 "RabbitMQ is accessible"
else
    print_result 1 "RabbitMQ is not accessible"
fi

# Test 2: Check Auth Service health
echo ""
echo "Test 2: Checking Auth Service..."
wait_for_service "$AUTH_SERVICE_URL/auth/health" "Auth Service"
response=$(curl -s "$AUTH_SERVICE_URL/auth/health")
if echo "$response" | grep -q "ok"; then
    print_result 0 "Auth Service health check passed"
else
    print_result 1 "Auth Service health check failed"
fi

# Test 3: Check Order Service health
echo ""
echo "Test 3: Checking Order Service..."
wait_for_service "$ORDER_SERVICE_URL/orders/health" "Order Service"
response=$(curl -s "$ORDER_SERVICE_URL/orders/health")
if echo "$response" | grep -q "ok"; then
    print_result 0 "Order Service health check passed"
else
    print_result 1 "Order Service health check failed"
fi

# Test 4: Check Inventory Service health
echo ""
echo "Test 4: Checking Inventory Service..."
wait_for_service "$INVENTORY_SERVICE_URL/inventory/health" "Inventory Service"
response=$(curl -s "$INVENTORY_SERVICE_URL/inventory/health")
if echo "$response" | grep -q "ok"; then
    print_result 0 "Inventory Service health check passed"
else
    print_result 1 "Inventory Service health check failed"
fi

# Test 5: User Registration
echo ""
echo "Test 5: Testing User Registration..."
register_response=$(curl -s -X POST "$AUTH_SERVICE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "password": "testpass123",
    "email": "test@example.com"
  }')

if echo "$register_response" | grep -q "User registered successfully"; then
    print_result 0 "User registration successful"
    username=$(echo "$register_response" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
else
    print_result 1 "User registration failed"
fi

# Test 6: User Login
echo ""
echo "Test 6: Testing User Login..."
login_response=$(curl -s -X POST "$AUTH_SERVICE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$username'",
    "password": "testpass123"
  }')

if echo "$login_response" | grep -q "access_token"; then
    print_result 0 "User login successful"
    token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
else
    print_result 1 "User login failed"
fi

# Test 7: Get initial inventory
echo ""
echo "Test 7: Checking Initial Inventory..."
initial_inventory=$(curl -s "$INVENTORY_SERVICE_URL/inventory/PROD001")
initial_available=$(echo "$initial_inventory" | grep -o '"available":[0-9]*' | cut -d':' -f2)
echo "Initial available quantity for PROD001: $initial_available"
print_result 0 "Initial inventory retrieved"

# Test 8: Create Order (Publisher)
echo ""
echo "Test 8: Creating Order (Event Publisher)..."
order_response=$(curl -s -X POST "$ORDER_SERVICE_URL/orders" \
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
  }')

if echo "$order_response" | grep -q '"id"'; then
    order_id=$(echo "$order_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_result 0 "Order created successfully (ID: $order_id)"
else
    print_result 1 "Order creation failed"
fi

# Test 9: Verify Event in RabbitMQ
echo ""
echo "Test 9: Verifying RabbitMQ Queue Activity..."
sleep 3  # Wait for event to be processed

queues=$(curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD "$RABBITMQ_MGMT_URL/api/queues")
if echo "$queues" | grep -q "inventory.order-events.queue"; then
    print_result 0 "RabbitMQ queue exists"
else
    print_result 1 "RabbitMQ queue not found"
fi

# Test 10: Verify Inventory Update (Consumer)
echo ""
echo "Test 10: Verifying Inventory Update (Event Consumer)..."
sleep 2  # Wait for event processing

updated_inventory=$(curl -s "$INVENTORY_SERVICE_URL/inventory/PROD001")
updated_available=$(echo "$updated_inventory" | grep -o '"available":[0-9]*' | cut -d':' -f2)
updated_reserved=$(echo "$updated_inventory" | grep -o '"reserved":[0-9]*' | cut -d':' -f2)

echo "Updated available quantity for PROD001: $updated_available"
echo "Reserved quantity for PROD001: $updated_reserved"

if [ "$updated_available" -lt "$initial_available" ]; then
    print_result 0 "Inventory successfully updated by consumer"
else
    print_result 1 "Inventory was not updated"
fi

# Test 11: Check Metrics
echo ""
echo "Test 11: Checking Prometheus Metrics..."
auth_metrics=$(curl -s "$AUTH_SERVICE_URL/auth/metrics")
if echo "$auth_metrics" | grep -q "auth_login_success_total"; then
    print_result 0 "Auth Service metrics available"
else
    print_result 1 "Auth Service metrics not available"
fi

order_metrics=$(curl -s "$ORDER_SERVICE_URL/orders/metrics")
if echo "$order_metrics" | grep -q "order_create_success_total"; then
    print_result 0 "Order Service metrics available"
else
    print_result 1 "Order Service metrics not available"
fi

inventory_metrics=$(curl -s "$INVENTORY_SERVICE_URL/inventory/metrics")
if echo "$inventory_metrics" | grep -q "inventory_order_events_processed_total"; then
    print_result 0 "Inventory Service metrics available"
else
    print_result 1 "Inventory Service metrics not available"
fi

# Test 12: Verify RabbitMQ Exchanges
echo ""
echo "Test 12: Verifying RabbitMQ Configuration..."
exchanges=$(curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD "$RABBITMQ_MGMT_URL/api/exchanges")
if echo "$exchanges" | grep -q "order.events" && echo "$exchanges" | grep -q "auth.events"; then
    print_result 0 "RabbitMQ exchanges configured correctly"
else
    print_result 1 "RabbitMQ exchanges not configured"
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}All tests passed!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "- RabbitMQ: Running and accessible"
echo "- Auth Service: Operational"
echo "- Order Service: Operational (Event Publisher)"
echo "- Inventory Service: Operational (Event Consumer)"
echo "- Event Flow: Working correctly"
echo "- Metrics: Exposed and available"
echo ""
echo "Access Points:"
echo "- RabbitMQ Management: $RABBITMQ_MGMT_URL"
echo "- Auth Service: $AUTH_SERVICE_URL"
echo "- Order Service: $ORDER_SERVICE_URL"
echo "- Inventory Service: $INVENTORY_SERVICE_URL"
echo ""
