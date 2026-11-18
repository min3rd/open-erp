const SYNONYMS: Record<string, string[]> = {
  'báo cáo': ['tường trình', 'bản báo cáo', 'tài liệu tổng hợp'],
  'kết luận': ['tổng kết', 'nhận định', 'kết thúc'],
  'quan trọng': ['trọng yếu', 'cần thiết', 'thiết yếu'],
  'nhanh': ['mau', 'nhanh chóng', 'tức thời'],
  'chậm': ['trễ', 'chậm trễ', 'khoan thai'],
  'bắt đầu': ['khởi đầu', 'bắt tay', 'mở đầu'],
  'kết thúc': ['hoàn tất', 'chấm dứt', 'kết liễu'],
  'tăng': ['tăng thêm', 'nâng cao', 'gia tăng'],
  'giảm': ['giảm bớt', 'hạ thấp', 'suy giảm'],
  'phân tích': ['mổ xẻ', 'đánh giá', 'nghiên cứu'],
  'hướng dẫn': ['chỉ dẫn', 'hướng đạo', 'dẫn dắt'],
  'tài liệu': ['văn bản', 'hồ sơ', 'tư liệu'],
  'chức năng': ['tính năng', 'công năng', 'nhiệm vụ'],
  'giao diện': ['bề mặt', 'diện mạo', 'giao diện người dùng'],
  'người dùng': ['người sử dụng', 'khách dùng', 'end user'],
  'dữ liệu': ['số liệu', 'thông tin', 'dữ kiện'],
  'quản lý': ['điều hành', 'quản trị', 'trông coi'],
  'kiểm tra': ['kiểm soát', 'thanh tra', 'soát xét'],
  'phát triển': ['phát triển', 'mở rộng', 'tiến triển'],
  'xác nhận': ['phê duyệt', 'chuẩn nhận', 'đồng ý'],
  'good': ['fine', 'great', 'positive'],
  'important': ['significant', 'essential', 'critical'],
  'report': ['account', 'summary', 'record'],
  'fast': ['quick', 'rapid', 'swift'],
  'start': ['begin', 'commence', 'launch'],
  'finish': ['complete', 'end', 'conclude'],
  'document': ['file', 'record', 'paper'],
  'feature': ['function', 'capability', 'facility'],
};

export function synonymsFor(word: string): string[] {
  const key = word.trim().toLowerCase();
  if (!key) return [];
  if (SYNONYMS[key]) return SYNONYMS[key];
  for (const [term, values] of Object.entries(SYNONYMS)) {
    if (term.includes(key) || key.includes(term)) return values;
  }
  return [];
}

export function thesaurusWords(): string[] {
  return Object.keys(SYNONYMS);
}
