/**
 * Utility function to convert a string into a URL-friendly slug
 * Used for generating navigation IDs from labels
 */

/**
 * Convert a string to a slug (lowercase, kebab-case, remove special chars)
 * @param text - The text to slugify
 * @param maxLength - Maximum length of the slug (default: 128)
 * @returns A slugified string
 */
export function slugify(text: string, maxLength: number = 128): string {
  if (!text) {
    return '';
  }

  return (
    String(text)
      .trim()
      // Convert to lowercase
      .toLowerCase()
      // Normalize unicode characters (remove diacritics)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace whitespace and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove all non-alphanumeric characters except hyphens and underscores
      .replace(/[^a-z0-9\-_]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length
      .slice(0, maxLength)
  );
}

/**
 * Generate a unique ID by appending a timestamp if needed
 * @param baseSlug - The base slug to use
 * @returns A slug with timestamp if base is empty
 */
export function generateUniqueSlug(baseSlug: string): string {
  const trimmedSlug = String(baseSlug || '').trim();
  if (trimmedSlug && trimmedSlug.length > 0) {
    return trimmedSlug;
  }
  // Fallback to timestamp-based ID if slug is empty
  return `nav-${Date.now()}`;
}
