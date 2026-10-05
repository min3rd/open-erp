/**
 * Minimal ambient types for `feather-icons` (v4). The package ships no
 * TypeScript declarations, so we declare just the shape the icon registry uses.
 */
declare module 'feather-icons' {
  export interface FeatherIcon {
    name: string;
    contents: string;
    attrs: Record<string, string>;
    tags: string[];
    toSvg(attrs?: Record<string, string | number>): string;
  }

  const feather: {
    icons: Record<string, FeatherIcon>;
  };

  export default feather;
}
