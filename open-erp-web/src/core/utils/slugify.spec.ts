import { slugify, generateUniqueSlug } from './slugify';

describe('slugify', () => {
  it('should convert uppercase to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world test')).toBe('hello-world-test');
  });

  it('should remove diacritics', () => {
    expect(slugify('Café Münchën')).toBe('cafe-munchen');
    expect(slugify('niño año')).toBe('nino-ano');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello@World#Test!')).toBe('helloworld-test');
    expect(slugify('test&demo*value')).toBe('testdemovalue');
  });

  it('should preserve hyphens and underscores', () => {
    expect(slugify('hello-world_test')).toBe('hello-world_test');
  });

  it('should replace multiple consecutive hyphens with single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle null/undefined by returning empty string', () => {
    expect(slugify(null as any)).toBe('');
    expect(slugify(undefined as any)).toBe('');
  });

  it('should respect max length', () => {
    const longText = 'a'.repeat(200);
    expect(slugify(longText, 50).length).toBe(50);
  });

  it('should use default max length of 128', () => {
    const longText = 'a'.repeat(200);
    expect(slugify(longText).length).toBe(128);
  });

  it('should handle complex Vietnamese text', () => {
    expect(slugify('Quản lý điều hướng')).toBe('quan-ly-dieu-huong');
    expect(slugify('Thêm mới người dùng')).toBe('them-moi-nguoi-dung');
  });

  it('should handle mixed case and special characters', () => {
    expect(slugify('User Management (Admin)')).toBe('user-management-admin');
    expect(slugify('Dashboard / Overview')).toBe('dashboard-overview');
  });

  it('should convert underscores to hyphens', () => {
    expect(slugify('hello_world_test')).toBe('hello-world-test');
  });

  it('should handle numbers correctly', () => {
    expect(slugify('Test 123 Item')).toBe('test-123-item');
    expect(slugify('Version 2.0')).toBe('version-20');
  });
});

describe('generateUniqueSlug', () => {
  it('should return the base slug if not empty', () => {
    expect(generateUniqueSlug('hello-world')).toBe('hello-world');
    expect(generateUniqueSlug('test')).toBe('test');
  });

  it('should generate timestamp-based ID for empty slug', () => {
    const result = generateUniqueSlug('');
    expect(result).toMatch(/^nav-\d+$/);
  });

  it('should generate timestamp-based ID for whitespace-only slug', () => {
    const result = generateUniqueSlug('   ');
    expect(result).toMatch(/^nav-\d+$/);
  });

  it('should preserve valid slugs', () => {
    const validSlug = 'my-valid-slug-123';
    expect(generateUniqueSlug(validSlug)).toBe(validSlug);
  });
});
