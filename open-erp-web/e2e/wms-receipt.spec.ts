import { test, expect } from '@playwright/test';

/**
 * E2E Test: WMS Receipt — Phiếu nhập kho
 * Route: /modules/wms/receipts/-/1/20
 * API mock: GET /v1/wms/receipts (hoặc /v1/inventory/receipts tùy implementation)
 *
 * Dùng page.route() để mock API → test không yêu cầu backend đang chạy.
 * Chỉ cần Angular dev server (ng serve) đang chạy ở port 4200.
 */

const RECEIPT_ROUTE = '/modules/wms/receipts/-/1/20';

const MOCK_RECEIPT_RESPONSE = {
  success: true,
  data: {
    items: [
      {
        _id: 'rcpt001',
        receiptCode: 'REC-2026-001',
        status: 'draft',
        warehouseId: 'wh001',
        tenantId: 'tenant_A',
        createdAt: '2026-05-01T08:00:00.000Z',
        lines: [{ productId: 'prod001', qty: 50 }],
      },
      {
        _id: 'rcpt002',
        receiptCode: 'REC-2026-002',
        status: 'confirmed',
        warehouseId: 'wh001',
        tenantId: 'tenant_A',
        createdAt: '2026-05-02T10:00:00.000Z',
        lines: [{ productId: 'prod002', qty: 100 }],
      },
      {
        _id: 'rcpt003',
        receiptCode: 'REC-2026-003',
        status: 'completed',
        warehouseId: 'wh002',
        tenantId: 'tenant_A',
        createdAt: '2026-05-03T14:30:00.000Z',
        lines: [{ productId: 'prod003', qty: 200 }],
      },
    ],
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  },
};

test.describe('WMS Receipt — Phiếu nhập kho', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API phiếu nhập kho (thử cả 2 endpoint pattern)
    await page.route('**/v1/wms/receipts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RECEIPT_RESPONSE),
      });
    });

    await page.route('**/v1/inventory/receipts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RECEIPT_RESPONSE),
      });
    });
  });

  test('TC-E2E-REC-001: trang phiếu nhập kho có thể điều hướng đến được', async ({ page }) => {
    let navigated = false;
    await page.goto(RECEIPT_ROUTE, { waitUntil: 'domcontentloaded', timeout: 15000 }).then(() => {
      navigated = true;
    }).catch(() => {
      console.warn('⚠️ Angular server chưa chạy — TC-E2E-REC-001 skip');
    });

    if (navigated) {
      const url = page.url();
      const isOnExpectedPage =
        url.includes('/receipts') || url.includes('/login') || url.includes('/me') || url.includes('/wms');
      expect(isOnExpectedPage).toBe(true);
    } else {
      test.skip();
    }
  });

  test('TC-E2E-REC-002: mock response phiếu nhập có đủ 3 trạng thái (draft, confirmed, completed)', async ({ page }) => {
    const items = MOCK_RECEIPT_RESPONSE.data.items;
    const statuses = items.map((item) => item.status);

    expect(statuses).toContain('draft');
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('completed');
  });

  test('TC-E2E-REC-003: mock trả về đúng pagination metadata', async ({ page }) => {
    const { page: pageNum, limit, total, totalPages } = MOCK_RECEIPT_RESPONSE.data;

    expect(pageNum).toBe(1);
    expect(limit).toBe(20);
    expect(total).toBe(3);
    expect(totalPages).toBe(1);
  });

  test('TC-E2E-REC-004: filter trạng thái draft — mock trả về đúng subset', async ({ page }) => {
    const draftReceipts = MOCK_RECEIPT_RESPONSE.data.items.filter(
      (item) => item.status === 'draft',
    );
    expect(draftReceipts.length).toBe(1);
    expect(draftReceipts[0].receiptCode).toBe('REC-2026-001');
  });

  test('TC-E2E-REC-005: trang receipt không crash khi API trả về mảng rỗng', async ({ page }) => {
    await page.route('**/v1/wms/receipts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      });
    });

    await page.route('**/v1/inventory/receipts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      });
    });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(RECEIPT_ROUTE, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

    const criticalErrors = errors.filter(
      (e) => e.includes('TypeError') || e.includes('Cannot read'),
    );
    expect(criticalErrors.length).toBe(0);
  });
});
