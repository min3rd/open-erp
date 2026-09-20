const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const RANGE = />=\s*(\d+\.\d+\.\d+)|<\s*(\d+\.\d+\.\d+)|(\d+\.\d+\.\d+)/g;

export function isValidSemver(value) {
  return typeof value === 'string' && SEMVER.test(value.trim());
}

export function parseSemver(value) {
  if (!isValidSemver(value)) {
    throw new Error(`Invalid SemVer: ${value}`);
  }
  const [major, minor, patch] = value.trim().split('.').map(Number);
  return { major, minor, patch };
}

export function satisfies(version, range) {
  if (!range || range.trim() === '' || range.trim() === '*') {
    return true;
  }
  const target = parseSemver(version);
  const conditions = range.split(/\s+/).filter(Boolean);
  return conditions.every((condition) => matchCondition(target, condition));
}

function matchCondition(target, condition) {
  if (condition.startsWith('>=')) {
    return compare(target, parseSemver(condition.slice(2))) >= 0;
  }
  if (condition.startsWith('<')) {
    return compare(target, parseSemver(condition.slice(1))) < 0;
  }
  return compare(target, parseSemver(condition)) === 0;
}

export function compare(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}
