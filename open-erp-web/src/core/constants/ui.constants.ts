import { ProductStatus } from '../services/product/product.service';

/**
 * Product Module UI Constants
 * Reusable dropdown options and configurations for product management
 */

/**
 * Product status dropdown options
 */
export const PRODUCT_STATUS_OPTIONS = [
  { label: 'Draft', value: ProductStatus.DRAFT },
  { label: 'Active', value: ProductStatus.ACTIVE },
  { label: 'Inactive', value: ProductStatus.INACTIVE },
  { label: 'Discontinued', value: ProductStatus.DISCONTINUED },
];

/**
 * Product unit of measurement dropdown options
 */
export const PRODUCT_UNIT_OPTIONS = [
  // Weight units
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Gram (g)', value: 'g' },
  { label: 'Ton', value: 'ton' },
  { label: 'Pound (lb)', value: 'lb' },
  
  // Volume units
  { label: 'Liter', value: 'liter' },
  { label: 'Milliliter (ml)', value: 'ml' },
  { label: 'Cubic Meter (m³)', value: 'm3' },
  { label: 'Gallon', value: 'gallon' },
  
  // Length units
  { label: 'Meter (m)', value: 'meter' },
  { label: 'Centimeter (cm)', value: 'cm' },
  { label: 'Millimeter (mm)', value: 'mm' },
  { label: 'Inch', value: 'inch' },
  
  // Area units
  { label: 'Square Meter (m²)', value: 'm2' },
  { label: 'Square Foot (sqf)', value: 'sqf' },
  
  // Quantity units
  { label: 'Piece', value: 'piece' },
  { label: 'Box', value: 'box' },
  { label: 'Carton', value: 'carton' },
  { label: 'Pallet', value: 'pallet' },
  { label: 'Container', value: 'container' },
  { label: 'Pack', value: 'pack' },
  { label: 'Set', value: 'set' },
  { label: 'Pair', value: 'pair' },
  { label: 'Dozen', value: 'dozen' },
];
