# OnlyOffice MinIO Integration Testing Guide

## Overview
This guide covers testing the fixes for OnlyOffice Document Server integration with MinIO, specifically addressing:
1. URLs containing `[object Object]` instead of proper organization IDs
2. OnlyOffice Document Server blocking private IP DNS lookups

## Prerequisites
- Backend services running (auth, user, inventory, file-service)
- Docker containers running (MongoDB, RabbitMQ, MinIO, OnlyOffice)
- Frontend web app running on http://localhost:4200
- User logged in with test credentials (NOTE: superadmin@example.com/123456aA@ are DEVELOPMENT ONLY credentials from seeding script, never use in production)

## Configuration Setup

### 1. Update .env file
Ensure the following environment variables are set in `open-erp-backend/.env`:

```bash
# MinIO Configuration
MINIO_ENDPOINT=host.docker.internal
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET=open-erp

# OnlyOffice Configuration
ONLYOFFICE_URL=http://localhost:8080
ONLYOFFICE_MINIO_URL=http://minio:9000
FILE_SERVICE_BASE_URL=http://localhost:3008
```

**Important**: `ONLYOFFICE_MINIO_URL=http://minio:9000` is the key setting that enables URL rewriting for Docker-to-Docker communication.

### 2. Verify Docker Network
Check that all containers are on the same network:
```bash
cd open-erp-backend
docker network ls
docker network inspect erp-network
```

## Test Cases

### Test 1: Verify presigned URL format (Backend)

**Objective**: Ensure presigned URLs don't contain `[object Object]`

**Steps**:
1. Start the backend services:
   ```bash
   cd open-erp-backend
   npm run file-service:dev
   npm run inventory:dev
   ```

2. Create a test request to generate a presigned upload URL:
   ```bash
   # Get JWT token first (login)
   TOKEN="your-jwt-token-here"
   
   # Request presigned URL for media upload
   curl -X GET "http://localhost:3006/v1/products/media/presign-upload?filename=test.docx&contentType=application/vnd.openxmlformats-officedocument.wordprocessingml.document&type=media" \
     -H "Authorization: Bearer $TOKEN" \
     -v
   ```

3. **Expected Result**: 
   - Response contains `objectKey` field
   - The `objectKey` should look like: `products/temp/org-{orgId}/media/{timestamp}-test.docx`
   - Should NOT contain `[object Object]` or `org-[object`
   
4. **Example Good Response**:
   ```json
   {
     "data": {
       "item": {
         "uploadUrl": "http://host.docker.internal:9000/...",
         "objectKey": "products/temp/org-65abc123def/media/1770613155864-test.docx",
         "bucket": "open-erp"
       }
     }
   }
   ```

### Test 2: OnlyOffice Session Creation (Backend)

**Objective**: Verify OnlyOffice session is created with proper MinIO URL rewriting

**Steps**:
1. Upload a document to a product first (or use existing product with Office file)

2. Create OnlyOffice session:
   ```bash
   curl -X POST "http://localhost:3008/v1/onlyoffice/session" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "minioKey": "products/temp/org-{orgId}/media/1770613155864-test.docx",
       "filename": "test.docx",
       "bucket": "open-erp",
       "mode": "view"
     }'
   ```

3. **Expected Result**:
   - Response contains `config.document.url`
   - The URL should be rewritten from `host.docker.internal` to `minio`
   - Example: `http://minio:9000/open-erp/products/temp/org-{orgId}/media/...`

4. Check file-service logs for URL rewriting message:
   ```
   [OnlyOfficeService] DEBUG Rewrote MinIO URL for OnlyOffice: http://host.docker.internal:9000/... -> http://minio:9000/...
   ```

### Test 3: Download File from OnlyOffice Container

**Objective**: Verify OnlyOffice can actually download the file from MinIO

**Steps**:
1. Get the rewritten MinIO URL from Test 2 response

2. Execute curl inside OnlyOffice container:
   ```bash
   docker exec -it erp-onlyoffice curl -I "http://minio:9000/open-erp/products/temp/org-{orgId}/media/{timestamp}-{filename}?X-Amz-Signature=..."
   ```

3. **Expected Result**:
   - HTTP 200 OK response
   - Content-Type header matching the file type
   - No DNS resolution errors
   - No private IP blocking errors

4. **Example Success**:
   ```
   HTTP/1.1 200 OK
   Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
   Content-Length: 12345
   ```

### Test 4: End-to-End UI Test

**Objective**: Open and edit Office document in OnlyOffice from the product page

**Steps**:
1. Navigate to http://localhost:4200 and login

2. Go to Products section → Edit a product that has Office file media

3. Upload a new Office document (if needed):
   - Click "Add Media"
   - Select a .docx, .xlsx, or .pptx file
   - Upload the file

4. Click the "Open in OnlyOffice" button on the uploaded document

5. **Expected Results**:
   - OnlyOffice editor opens (either in drawer, fullscreen, or detached window)
   - Document loads and displays content correctly
   - No error messages in browser console
   - No "File not found" or "DNS lookup" errors

6. **Check browser console**:
   - Open Developer Tools → Console
   - Look for any errors related to OnlyOffice
   - Should see successful API calls to `/v1/onlyoffice/session`

7. **Test editing** (if mode is 'edit'):
   - Make a change to the document
   - Changes should be auto-saved
   - Close and reopen to verify changes persisted

### Test 5: Check OnlyOffice Document Server Logs

**Objective**: Verify no private IP blocking errors in OnlyOffice logs

**Steps**:
1. View OnlyOffice container logs:
   ```bash
   docker logs erp-onlyoffice --tail 100 -f
   ```

2. Perform Test 4 (open document in UI)

3. **Expected Result**:
   - No errors about "DNS lookup ... is not allowed"
   - No errors about "private IP address"
   - Successful document conversion and loading messages

4. **Example Good Log**:
   ```
   [INFO] Download file from http://minio:9000/open-erp/products/... 
   [INFO] Document loaded successfully
   ```

5. **Example Bad Log** (should NOT see this):
   ```
   [ERROR] DNS lookup 192.168.65.254(family:4, host:host.docker.internal) is not allowed. Because, It is private IP address.
   ```

## Troubleshooting

### Issue: Still seeing `[object Object]` in URLs

**Solution**:
- Verify backend code changes are deployed
- Restart inventory and file-service: `npm run inventory:dev` and `npm run file-service:dev`
- Check that JWT token has string organizationId, not object
- Review auth service token generation code

### Issue: OnlyOffice cannot reach MinIO

**Solution**:
- Verify `ONLYOFFICE_MINIO_URL=http://minio:9000` is set in .env
- Restart file-service: `npm run file-service:dev`
- Check Docker network: `docker network inspect erp-network`
- Verify both OnlyOffice and MinIO are on erp-network
- Test connectivity: `docker exec erp-onlyoffice ping -c 3 minio`

### Issue: Private IP still blocked

**Solution**:
- Double-check URL rewriting is working (see Test 2)
- Verify OnlyOffice container has `extra_hosts` configuration in docker-compose.dev.yml
- Restart OnlyOffice container: `docker restart erp-onlyoffice`
- Check that presigned URLs are being rewritten in logs

### Issue: File not found in MinIO

**Solution**:
- Verify the file was actually uploaded to MinIO
- Check MinIO console: http://localhost:9001 (minioadmin/minioadmin)
- Browse to open-erp bucket and verify file exists
- Check that objectKey in presigned URL matches actual file path

## Success Criteria

All of the following must be true:
- ✅ Presigned URLs do NOT contain `[object Object]`
- ✅ OnlyOffice session response contains rewritten MinIO URL (`http://minio:9000/...`)
- ✅ curl from OnlyOffice container returns HTTP 200
- ✅ Document opens in UI without errors
- ✅ OnlyOffice logs show no private IP blocking errors
- ✅ Document can be viewed/edited successfully

## Additional Notes

### URL Rewriting Logic
The URL rewriting happens in `onlyoffice.service.ts`:
- Presigned URL from MinIO uses `MINIO_ENDPOINT` (browser-accessible)
- Before sending to OnlyOffice, URL is rewritten to use `ONLYOFFICE_MINIO_URL` (Docker-internal)
- Query parameters (signatures) are preserved during rewriting

### Organization ID Handling
The fix ensures organizationId is always converted to string:
- Query parameter `organizationId`: already a string
- User context `user.organizationId`: might be MongoDB ObjectId object
- Solution: Use `String(orgId)` to convert any type to string
- Prevents `org-[object Object]` in file paths

### Docker Networking
- Browser → MinIO: uses `http://localhost:9000` or `http://host.docker.internal:9000`
- OnlyOffice → MinIO: uses `http://minio:9000` (Docker network)
- Both point to the same MinIO instance
- URL rewriting bridges the gap between these two access methods
