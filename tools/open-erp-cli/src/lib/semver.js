const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function isValidSemver(value) {
  return typeof value === 'string' && SEMVER.test(value.trim());
}
