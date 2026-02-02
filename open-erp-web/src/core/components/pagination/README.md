# Pagination Component

Shared pagination wrapper for list screens. It renders First/Previous/Page numbers/Next/Last
controls plus a page-size selector based on `PAGE_SIZE_OPTIONS`.

## Usage

```html
<core-pagination
  [idPrefix]="'user-list'"
  [totalRecords]="totalRecords()"
  [currentPage]="currentPage()"
  [pageSize]="pageSize()"
  (pageChange)="onPageChange($event)"
/>
```

### Inputs

- `idPrefix`: string prefix for generated IDs (`{prefix}-pagination-*`)
- `totalRecords`: total item count
- `currentPage`: current page (1-based)
- `pageSize`: current page size
- `pageLinkSize`: number of page links to display (default: 5)

### Outputs

- `pageChange({ page, pageSize })`: emits on page navigation or size change
- `navigateTo(page)`: emits the page number being navigated to
- `changePageSize(size)`: emits when the page size changes
