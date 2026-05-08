// ─── Legacy microservices (còn chạy trong giai đoạn migration) ──────────────
export const API_URI_AUTH = 'http://localhost:3001';
export const API_URI_USER = 'http://localhost:3002';
export const API_URI_NOTIFICATION = 'http://localhost:3003';
export const API_URI_CONFIG = 'http://localhost:3004';
export const API_URI_ORGANIZATION = 'http://localhost:3005';
export const API_URI_INVENTORY = 'http://localhost:3006'; // legacy — sẽ thay bằng API_URI_WMS
export const API_URI_COMMON = 'http://localhost:3007'; // legacy — thay bằng API_URI_PLATFORM
export const API_URI_FILE = 'http://localhost:3008';   // legacy
export const API_URI_CHAT = 'http://localhost:3009';
export const API_URI_DATA_TRANSFER = 'http://localhost:3010';
export const API_URI_APPROVAL = 'http://localhost:3011';

// ─── Domain services (kiến trúc mới 6-domain SaaS) ──────────────────────────
/** Platform Service — Master catalog: UoM, Category, ProductType, Tag, Attribute, Tenant Policy */
export const API_URI_PLATFORM = 'http://localhost:3007';
/** WMS Domain Service — Stock, Transfer, Receipt, Shipment, Picklist, Import/Export */
export const API_URI_WMS = 'http://localhost:3008';
