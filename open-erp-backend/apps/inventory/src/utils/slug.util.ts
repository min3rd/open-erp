import slugify from 'slugify';

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A normalized, lowercase slug
 */
export function generateSlug(text: string): string {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is required to generate slug');
  }

  return slugify(text, {
    lower: true, // Convert to lowercase
    strict: true, // Strip special characters except replacement
    remove: /[*+~.()'"!:@]/g, // Remove specific special characters
    trim: true, // Trim leading and trailing whitespace
  });
}

/**
 * Generate a unique slug by appending a suffix if needed
 * @param baseSlug - The base slug
 * @param existingCheck - Function to check if slug exists
 * @param maxAttempts - Maximum number of attempts to find a unique slug
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existingCheck: (slug: string) => Promise<boolean>,
  maxAttempts: number = 100,
): Promise<string> {
  let slug = baseSlug;
  let attempt = 1;

  while (await existingCheck(slug)) {
    if (attempt >= maxAttempts) {
      throw new Error(
        `Could not generate unique slug after ${maxAttempts} attempts`,
      );
    }
    slug = `${baseSlug}-${attempt}`;
    attempt++;
  }

  return slug;
}
