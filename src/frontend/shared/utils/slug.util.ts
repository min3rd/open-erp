/**
 * URL slug from arbitrary text (lowercases, strips accents and folds `đ`).
 * Shared by Web and Mobile register-business forms.
 * NOTE: web's register-business component still has a local copy — move it to
 * this import when web is next touched.
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
