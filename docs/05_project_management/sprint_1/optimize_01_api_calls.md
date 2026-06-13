# Tài liệu tối ưu hóa hiệu năng: OPT-1.1 - Giới hạn số lượng cuộc gọi API đồng thời
## Phân hệ: Web Client (`open-erp-web`) & Backend Services (`open-erp-services`) - Sprint 1

---

### 1. Mục tiêu tối ưu (Optimization Goal)
Để nâng cao hiệu năng tải trang, giảm tải băng thông mạng, tối ưu hóa hồ kết nối (connection pool) trên trình duyệt và giảm thiểu xung kích tải lên hệ thống máy chủ, dự án quy chuẩn hóa quy tắc tải dữ liệu:
* **Giới hạn kết nối**: Mỗi màn hình/giao diện chức năng chỉ được phép thực hiện **tối đa 3 cuộc gọi API đồng thời** tại một thời điểm (kể cả thời điểm khởi tạo trang đầu tiên).

---

### 2. Các chiến lược tối ưu hóa chi tiết (Optimization Strategies)

#### 2.1 Gộp API (API Batching / Aggregation)
Thay vì để giao diện client gọi riêng rẽ nhiều API nhỏ phục vụ cho các danh mục dữ liệu tĩnh hoặc dữ liệu bổ trợ (lookups), Backend cần cung cấp một API tổng hợp để tải toàn bộ dữ liệu trong một yêu cầu HTTP duy nhất.
* **Trước (Không tối ưu - 4 cuộc gọi đồng thời)**:
  * `GET /api/v1/branches`
  * `GET /api/v1/departments`
  * `GET /api/v1/roles`
  * `GET /api/v1/languages`
* **Sau (Tối ưu - 1 cuộc gọi)**:
  * `GET /api/v1/common/lookups?types=branches,departments,roles,languages`
  * Dữ liệu trả về sẽ có dạng:
    ```json
    {
      "branches": [...],
      "departments": [...],
      "roles": [...],
      "languages": [...]
    }
    ```

#### 2.2 Tải lười / Tải theo nhu cầu (Lazy / On-demand Loading)
Tránh việc tải toàn bộ dữ liệu của màn hình ngay khi khởi động (`ngOnInit`). Dữ liệu chỉ được tải khi thực sự cần thiết:
* **Tải theo Tab**: Chỉ tải dữ liệu của tab khi người dùng nhấn vào tab đó.
* **Tải khi hiển thị (Scroll/Intersection Observer)**: Chỉ tải dữ liệu (ví dụ: danh sách tài liệu đính kèm, lịch sử hoạt động ở cuối trang) khi cấu phần đó được cuộn vào viewport của người dùng.
* **Phân trang & Tìm kiếm**: Không tự động tải danh sách lớn, giới hạn số bản ghi ban đầu ở mức nhỏ (10-20 dòng).

#### 2.3 Cơ chế Cache phía Client (RxJS shareReplay)
Đối với các dữ liệu cấu hình hoặc danh mục ít khi thay đổi (như danh sách quốc gia, tỉnh thành, cấu hình phân quyền): sử dụng toán tử `shareReplay(1)` để lưu cache trong memory ở tầng Service. Khi nhiều component cùng gọi hàm lấy dữ liệu, Service chỉ gửi đúng 1 HTTP Request đầu tiên và trả dữ liệu cache cho các lần gọi sau.
```typescript
private countries$ = this.http.get<Country[]>('/api/v1/countries').pipe(
  shareReplay(1) // Chỉ gọi API 1 lần duy nhất, các subscriber sau sẽ dùng chung dữ liệu cache
);

getCountries(): Observable<Country[]> {
  return this.countries$;
}
```

#### 2.4 Kiểm soát giới hạn đồng thời bằng RxJS (RxJS Concurrency Limit)
Khi ứng dụng bắt buộc phải xử lý tải nhiều nguồn dữ liệu song song (ví dụ: tải danh sách các báo cáo chi tiết riêng biệt), sử dụng toán tử `mergeMap` hoặc `merge` của RxJS kèm tham số giới hạn concurrency:
```typescript
import { from, mergeMap } from 'rxjs';

// Giả sử có danh sách 6 item cần tải thông tin chi tiết
const itemsToLoad = [1, 2, 3, 4, 5, 6];

from(itemsToLoad).pipe(
  // Tham số thứ 2 là '3', giới hạn Angular chỉ thực hiện tối đa 3 HTTP Request đồng thời
  mergeMap(id => this.reportsService.getReportDetail(id), 3)
).subscribe(result => {
  // Xử lý kết quả trả về lần lượt
});
```

---

### 3. Quy trình thiết kế & Phát triển (Dev Workflow Rules)

1. **Phân tích trước khi code**: Lập trình viên thiết kế giao diện phải liệt kê toàn bộ các API cần gọi trên màn hình. Nếu số lượng API khởi tạo lớn hơn 3, bắt buộc phải chọn 1 trong các phương án:
   * Yêu cầu Backend viết API gộp.
   * Chuyển các khối thông tin phụ xuống Accordion/Tab và chỉ tải khi click.
   * Sử dụng RxJS để xếp hàng đợi (queue) các luồng tải.
2. **Kiểm tra định kỳ (DevTools Check)**: 
   * Mở F12 -> tab Network -> lọc theo loại XHR/Fetch.
   * Sắp xếp theo cột Watermark / Timeline để kiểm tra trạng thái `Pending` của các request. Tại mọi thời điểm, không được có quá 3 request đang ở trạng thái pending song song.

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)

1. **Không nghẽn kết nối**: Trình duyệt tải trang mượt mà, không xảy ra hiện tượng chặn (blocking) hàng đợi HTTP do gọi quá nhiều API cùng lúc.
2. **Đúng giới hạn**: Số lượng API call đồng thời tại thời điểm khởi động trang bất kỳ không vượt quá 3.
3. **Hiển thị tiến độ**: Sử dụng các thành phần Loading Skeleton hoặc Spinner độc lập cho từng khối dữ liệu được tải trễ để nâng cao trải nghiệm người dùng.
