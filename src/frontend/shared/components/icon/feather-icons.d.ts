/**
 * Minimal ambient types for `feather-icons` (v4). The package ships no
 * TypeScript declarations, so we declare just the shape the icon registry uses.
 */
declare module 'feather-icons' {
  const feather: {
    icons: Record<string, { contents: string }>;
  };

  export default feather;
}
