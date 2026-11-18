import type { ExcelCell, ExcelSheet } from './types';

export class FormulaError {
  constructor(readonly code: string) {}
}

export type ScalarValue = number | string | boolean | null;
export type FormulaValue = ScalarValue | FormulaError;
export interface RangeValue {
  kind: 'range';
  rows: FormulaValue[][];
}
export type EvalValue = FormulaValue | RangeValue;

export interface EvalContext {
  getCell(ref: string): FormulaValue;
  getRange(start: string, end: string): RangeValue;
}

const ERR = {
  div0: () => new FormulaError('#DIV/0!'),
  value: () => new FormulaError('#VALUE!'),
  ref: () => new FormulaError('#REF!'),
  name: () => new FormulaError('#NAME?'),
  na: () => new FormulaError('#N/A'),
  num: () => new FormulaError('#NUM!'),
  circular: () => new FormulaError('#CIRCULAR!'),
};

export function isFormulaError(value: unknown): value is FormulaError {
  return value instanceof FormulaError;
}

/* ------------------------------- tokenizer ------------------------------- */

type TokenType = 'num' | 'str' | 'ref' | 'func' | 'bool' | 'op' | 'lparen' | 'rparen' | 'comma' | 'colon';
interface Token { type: TokenType; value: string }

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) { index++; continue; }
    if (char === '"') {
      let value = '';
      index++;
      while (index < input.length) {
        if (input[index] === '"') {
          if (input[index + 1] === '"') { value += '"'; index += 2; continue; }
          index++;
          break;
        }
        value += input[index++];
      }
      tokens.push({ type: 'str', value });
      continue;
    }
    const number = /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(input.slice(index));
    if (number) {
      tokens.push({ type: 'num', value: number[0] });
      index += number[0].length;
      continue;
    }
    const fn = /^[A-Za-z_][A-Za-z0-9_.]*\s*\(/.exec(input.slice(index));
    if (fn) {
      const name = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(index))![0];
      tokens.push({ type: 'func', value: name.toUpperCase() });
      index += name.length;
      continue;
    }
    const ref = /^\$?[A-Za-z]{1,3}\$?\d+/.exec(input.slice(index));
    if (ref) {
      tokens.push({ type: 'ref', value: ref[0].replace(/\$/g, '').toUpperCase() });
      index += ref[0].length;
      continue;
    }
    const ident = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(index));
    if (ident) {
      const name = ident[0];
      index += name.length;
      let cursor = index;
      while (cursor < input.length && /\s/.test(input[cursor])) cursor++;
      if (input[cursor] === '(') {
        tokens.push({ type: 'func', value: name.toUpperCase() });
      } else if (/^(TRUE|FALSE)$/i.test(name)) {
        tokens.push({ type: 'bool', value: name.toUpperCase() });
      } else {
        tokens.push({ type: 'func', value: name.toUpperCase() });
      }
      continue;
    }
    const pair = input.slice(index, index + 2);
    if (['<=', '>=', '<>'].includes(pair)) {
      tokens.push({ type: 'op', value: pair });
      index += 2;
      continue;
    }
    if ('+-*/^&=<>%'.includes(char)) {
      tokens.push({ type: 'op', value: char });
      index++;
      continue;
    }
    if (char === '(') { tokens.push({ type: 'lparen', value: char }); index++; continue; }
    if (char === ')') { tokens.push({ type: 'rparen', value: char }); index++; continue; }
    if (char === ',') { tokens.push({ type: 'comma', value: char }); index++; continue; }
    if (char === ';') { tokens.push({ type: 'comma', value: char }); index++; continue; }
    if (char === ':') { tokens.push({ type: 'colon', value: char }); index++; continue; }
    index++;
  }
  return tokens;
}

/* --------------------------------- parser -------------------------------- */

type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; v: string }
  | { t: 'range'; a: string; b: string }
  | { t: 'func'; name: string; args: Node[] }
  | { t: 'unary'; op: string; v: Node }
  | { t: 'binary'; op: string; a: Node; b: Node };

class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.expression();
    if (this.index !== this.tokens.length) throw ERR.value();
    return node;
  }

  private peek(): Token | undefined { return this.tokens[this.index]; }
  private next(): Token | undefined { return this.tokens[this.index++]; }
  private match(type: TokenType, value?: string): boolean {
    const token = this.peek();
    return !!token && token.type === type && (value === undefined || token.value === value);
  }
  private expect(type: TokenType): Token {
    const token = this.next();
    if (!token || token.type !== type) throw ERR.value();
    return token;
  }

  private expression(): Node {
    let left = this.concat();
    while (this.match('op') && ['=', '<>', '<', '<=', '>', '>='].includes(this.peek()!.value)) {
      const op = this.next()!.value;
      left = { t: 'binary', op, a: left, b: this.concat() };
    }
    return left;
  }

  private concat(): Node {
    let left = this.additive();
    while (this.match('op', '&')) {
      this.next();
      left = { t: 'binary', op: '&', a: left, b: this.additive() };
    }
    return left;
  }

  private additive(): Node {
    let left = this.multiplicative();
    while (this.match('op') && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.next()!.value;
      left = { t: 'binary', op, a: left, b: this.multiplicative() };
    }
    return left;
  }

  private multiplicative(): Node {
    let left = this.power();
    while (this.match('op') && ['*', '/'].includes(this.peek()!.value)) {
      const op = this.next()!.value;
      left = { t: 'binary', op, a: left, b: this.power() };
    }
    return left;
  }

  private power(): Node {
    let left = this.unary();
    if (this.match('op', '^')) {
      this.next();
      left = { t: 'binary', op: '^', a: left, b: this.unary() };
    }
    return left;
  }

  private unary(): Node {
    if (this.match('op') && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.next()!.value;
      return { t: 'unary', op, v: this.unary() };
    }
    let node = this.primary();
    while (this.match('op', '%')) {
      this.next();
      node = { t: 'binary', op: '%', a: node, b: { t: 'num', v: 100 } };
    }
    return node;
  }

  private primary(): Node {
    const token = this.next();
    if (!token) throw ERR.value();
    if (token.type === 'num') return { t: 'num', v: Number(token.value) };
    if (token.type === 'str') return { t: 'str', v: token.value };
    if (token.type === 'bool') return { t: 'bool', v: token.value === 'TRUE' };
    if (token.type === 'ref') {
      if (this.match('colon')) {
        this.next();
        const end = this.expect('ref');
        return { t: 'range', a: token.value, b: end.value };
      }
      return { t: 'ref', v: token.value };
    }
    if (token.type === 'lparen') {
      const node = this.expression();
      this.expect('rparen');
      return node;
    }
    if (token.type === 'func') {
      this.expect('lparen');
      const args: Node[] = [];
      if (!this.match('rparen')) {
        args.push(this.expression());
        while (this.match('comma')) {
          this.next();
          args.push(this.expression());
        }
      }
      this.expect('rparen');
      return { t: 'func', name: token.value, args };
    }
    throw ERR.value();
  }
}

/* ------------------------------- evaluation ------------------------------ */

function evaluateNode(node: Node, ctx: EvalContext): EvalValue {
  switch (node.t) {
    case 'num': return node.v;
    case 'str': return node.v;
    case 'bool': return node.v;
    case 'ref': return ctx.getCell(node.v);
    case 'range': return ctx.getRange(node.a, node.b);
    case 'unary': {
      const value = numeric(evaluateNode(node.v, ctx));
      if (isFormulaError(value)) return value;
      return node.op === '-' ? -value : value;
    }
    case 'binary': return evaluateBinary(node.op, evaluateNode(node.a, ctx), evaluateNode(node.b, ctx));
    case 'func': {
      const fn = FUNCTIONS[node.name];
      if (!fn) return ERR.name();
      const args = node.args.map((arg) => evaluateNode(arg, ctx));
      return fn(args, ctx);
    }
    default: return ERR.value();
  }
}

function evaluateBinary(op: string, left: EvalValue, right: EvalValue): FormulaValue {
  if (isFormulaError(left)) return left;
  if (isFormulaError(right)) return right;
  if (op === '&') return text(left) + text(right);
  if (['=', '<>', '<', '<=', '>', '>='].includes(op)) {
    const a = scalar(left);
    const b = scalar(right);
    if (isFormulaError(a)) return a;
    if (isFormulaError(b)) return b;
    switch (op) {
      case '=': return compare(a, b) === 0;
      case '<>': return compare(a, b) !== 0;
      case '<': return compare(a, b) < 0;
      case '<=': return compare(a, b) <= 0;
      case '>': return compare(a, b) > 0;
      default: return compare(a, b) >= 0;
    }
  }
  const a = numeric(left);
  const b = numeric(right);
  if (isFormulaError(a)) return a;
  if (isFormulaError(b)) return b;
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? ERR.div0() : a / b;
    case '^': return Math.pow(a, b);
    case '%': return a / b;
    default: return ERR.value();
  }
}

function isRange(value: unknown): value is RangeValue {
  return typeof value === 'object' && value !== null && (value as RangeValue).kind === 'range';
}

function scalar(value: EvalValue): FormulaValue {
  if (value === null) return null;
  return isRange(value) ? ERR.value() : value as FormulaValue;
}

function numeric(value: EvalValue): number | FormulaError {
  if (isFormulaError(value)) return value;
  const single = scalar(value);
  if (isFormulaError(single)) return single;
  if (single === null) return 0;
  if (typeof single === 'number') return single;
  if (typeof single === 'boolean') return single ? 1 : 0;
  const trimmed = single.trim();
  if (trimmed === '') return 0;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : ERR.value();
}

function text(value: EvalValue): string {
  if (isFormulaError(value)) return value.code;
  if (isRange(value)) return ERR.value().code;
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function compare(a: FormulaValue, b: FormulaValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const aText = String(a ?? '').toLowerCase();
  const bText = String(b ?? '').toLowerCase();
  return aText.localeCompare(bText);
}

function flatten(args: EvalValue[]): FormulaValue[] {
  const result: FormulaValue[] = [];
  for (const arg of args) {
    if (isRange(arg)) {
      for (const row of arg.rows) for (const value of row) result.push(value);
    } else {
      result.push(arg as FormulaValue);
    }
  }
  return result;
}

function numbers(args: EvalValue[]): number[] | FormulaError {
  const result: number[] = [];
  for (const value of flatten(args)) {
    if (isFormulaError(value)) return value;
    if (typeof value === 'number') result.push(value);
    else if (typeof value === 'boolean') result.push(value ? 1 : 0);
    else if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value.replace(/,/g, ''));
      if (Number.isFinite(parsed)) result.push(parsed);
    }
  }
  return result;
}

function one(args: EvalValue[], index = 0): FormulaValue {
  return scalar(args[index] ?? null);
}

function matrix(value: EvalValue): FormulaValue[][] | FormulaError {
  if (isFormulaError(value)) return value;
  if (!isRange(value)) return [[value as FormulaValue]];
  return value.rows;
}

function criteriaMatches(value: FormulaValue, criteria: FormulaValue): boolean {
  if (isFormulaError(value)) return false;
  if (typeof criteria === 'string') {
    const match = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(criteria);
    const op = match?.[1] ?? '=';
    const target = match?.[2] ?? criteria;
    const numericTarget = Number(target);
    if (Number.isFinite(numericTarget) && typeof value === 'number') {
      return op === '=' ? value === numericTarget
        : op === '<>' ? value !== numericTarget
        : op === '<' ? value < numericTarget
        : op === '<=' ? value <= numericTarget
        : op === '>' ? value > numericTarget
        : value >= numericTarget;
    }
    const left = String(value ?? '').toLowerCase();
    const right = target.toLowerCase();
    return op === '<>' ? left !== right : left === right;
  }
  return value === criteria;
}

/* -------------------------------- functions ------------------------------ */

type FormulaFunction = (args: EvalValue[], ctx: EvalContext) => FormulaValue;

const FUNCTIONS: Record<string, FormulaFunction> = {};
function define(name: string, fn: FormulaFunction): void { FUNCTIONS[name] = fn; }

const round = (value: number, digits = 0): number => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};
const asNumbers = (args: EvalValue[]): number[] | FormulaError => numbers(args);

define('SUM', (args) => { const values = asNumbers(args); return isFormulaError(values) ? values : values.reduce((a, b) => a + b, 0); });
define('PRODUCT', (args) => { const values = asNumbers(args); return isFormulaError(values) ? values : values.reduce((a, b) => a * b, 1); });
define('AVERAGE', (args) => { const values = asNumbers(args); if (isFormulaError(values)) return values; return values.length ? values.reduce((a, b) => a + b, 0) / values.length : ERR.div0(); });
define('MIN', (args) => { const values = asNumbers(args); return isFormulaError(values) ? values : values.length ? Math.min(...values) : 0; });
define('MAX', (args) => { const values = asNumbers(args); return isFormulaError(values) ? values : values.length ? Math.max(...values) : 0; });
define('MEDIAN', (args) => {
  const values = asNumbers(args); if (isFormulaError(values)) return values;
  if (!values.length) return ERR.num();
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
});
define('COUNT', (args) => { const values = asNumbers(args); return isFormulaError(values) ? values : values.length; });
define('COUNTA', (args) => flatten(args).filter((value) => value !== null && value !== '' && !isFormulaError(value)).length);
define('COUNTBLANK', (args) => flatten(args).filter((value) => value === null || value === '').length);
const argsToNumbers = (args: EvalValue[], count: number, defaults: number[] = []): number[] | FormulaError => {
  const values: number[] = [];
  for (let index = 0; index < count; index++) {
    if (index >= args.length && defaults[index] !== undefined) {
      values.push(defaults[index]);
      continue;
    }
    const value = numeric(one(args, index));
    if (isFormulaError(value)) return value;
    values.push(value);
  }
  return values;
};

const mathFn = (count: number, defaults: number[], fn: (...values: number[]) => number): FormulaFunction =>
  (args) => {
    const values = argsToNumbers(args, count, defaults);
    return isFormulaError(values) ? values : fn(...values);
  };

define('ABS', mathFn(1, [], Math.abs));
define('INT', mathFn(1, [], Math.floor));
define('TRUNC', mathFn(1, [], Math.trunc));
define('SIGN', mathFn(1, [], Math.sign));
define('SQRT', (args) => { const values = argsToNumbers(args, 1); return isFormulaError(values) ? values : values[0] < 0 ? ERR.num() : Math.sqrt(values[0]); });
define('POWER', mathFn(2, [], Math.pow));
define('MOD', (args) => { const values = argsToNumbers(args, 2); return isFormulaError(values) ? values : values[1] === 0 ? ERR.div0() : values[0] % values[1]; });
define('ROUND', (args) => { const values = argsToNumbers(args, 2, [0, 0]); return isFormulaError(values) ? values : round(values[0], values[1]); });
define('ROUNDUP', (args) => {
  const values = argsToNumbers(args, 2, [0, 0]); if (isFormulaError(values)) return values;
  const factor = Math.pow(10, values[1]);
  return Math.ceil(values[0] * factor) / factor;
});
define('ROUNDDOWN', (args) => {
  const values = argsToNumbers(args, 2, [0, 0]); if (isFormulaError(values)) return values;
  const factor = Math.pow(10, values[1]);
  return Math.floor(values[0] * factor) / factor;
});
define('CEILING', (args) => {
  const values = argsToNumbers(args, 2, [0, 1]); if (isFormulaError(values)) return values;
  return values[1] === 0 ? ERR.div0() : Math.ceil(values[0] / values[1]) * values[1];
});
define('FLOOR', (args) => {
  const values = argsToNumbers(args, 2, [0, 1]); if (isFormulaError(values)) return values;
  return values[1] === 0 ? ERR.div0() : Math.floor(values[0] / values[1]) * values[1];
});
define('PI', () => Math.PI);
define('EXP', mathFn(1, [], Math.exp));
define('LN', (args) => { const values = argsToNumbers(args, 1); return isFormulaError(values) ? values : values[0] <= 0 ? ERR.num() : Math.log(values[0]); });
define('LOG10', (args) => { const values = argsToNumbers(args, 1); return isFormulaError(values) ? values : values[0] <= 0 ? ERR.num() : Math.log10(values[0]); });
define('LOG', (args) => {
  const values = argsToNumbers(args, 2, [0, 10]); if (isFormulaError(values)) return values;
  return values[0] <= 0 || values[1] <= 0 ? ERR.num() : Math.log(values[0]) / Math.log(values[1]);
});
define('SIN', mathFn(1, [], Math.sin));
define('COS', mathFn(1, [], Math.cos));
define('TAN', mathFn(1, [], Math.tan));
define('ASIN', (args) => { const values = argsToNumbers(args, 1); return isFormulaError(values) ? values : Math.abs(values[0]) > 1 ? ERR.num() : Math.asin(values[0]); });
define('ACOS', (args) => { const values = argsToNumbers(args, 1); return isFormulaError(values) ? values : Math.abs(values[0]) > 1 ? ERR.num() : Math.acos(values[0]); });
define('ATAN', mathFn(1, [], Math.atan));
define('ATAN2', mathFn(2, [], Math.atan2));
define('DEGREES', mathFn(1, [], (value) => value * 180 / Math.PI));
define('RADIANS', mathFn(1, [], (value) => value * Math.PI / 180));

define('SUMIF', (args) => {
  const range = matrix(args[0] ?? null); if (isFormulaError(range)) return range;
  const criteria = one(args, 1);
  const sumRange = args[2] ? matrix(args[2]) : range;
  if (isFormulaError(sumRange)) return sumRange;
  let total = 0;
  range.forEach((row, r) => row.forEach((value, c) => {
    if (criteriaMatches(value, criteria)) {
      const target = sumRange[r]?.[c];
      if (typeof target === 'number') total += target;
    }
  }));
  return total;
});
define('COUNTIF', (args) => {
  const range = matrix(args[0] ?? null); if (isFormulaError(range)) return range;
  const criteria = one(args, 1);
  let count = 0;
  range.forEach((row) => row.forEach((value) => { if (criteriaMatches(value, criteria)) count++; }));
  return count;
});
define('AVERAGEIF', (args) => {
  const range = matrix(args[0] ?? null); if (isFormulaError(range)) return range;
  const criteria = one(args, 1);
  const avgRange = args[2] ? matrix(args[2]) : range;
  if (isFormulaError(avgRange)) return avgRange;
  let total = 0, count = 0;
  range.forEach((row, r) => row.forEach((value, c) => {
    if (criteriaMatches(value, criteria) && typeof avgRange[r]?.[c] === 'number') {
      total += avgRange[r][c] as number; count++;
    }
  }));
  return count ? total / count : ERR.div0();
});
define('SUMIFS', (args) => {
  const sumRange = matrix(args[0] ?? null); if (isFormulaError(sumRange)) return sumRange;
  let total = 0;
  sumRange.forEach((row, r) => row.forEach((value, c) => {
    let match = true;
    for (let index = 1; index + 1 < args.length; index += 2) {
      const range = matrix(args[index]); if (isFormulaError(range)) { match = false; break; }
      if (!criteriaMatches(range[r]?.[c] ?? null, one(args, index + 1))) { match = false; break; }
    }
    if (match && typeof value === 'number') total += value;
  }));
  return total;
});
define('SUMPRODUCT', (args) => {
  const matrices = args.map(matrix);
  if (matrices.some(isFormulaError)) return ERR.value();
  const valid = matrices as FormulaValue[][][];
  let total = 0;
  valid[0].forEach((row, r) => row.forEach((value, c) => {
    let product = typeof value === 'number' ? value : 0;
    for (let m = 1; m < valid.length; m++) {
      const other = valid[m][r]?.[c];
      product *= typeof other === 'number' ? other : 0;
    }
    total += product;
  }));
  return total;
});

define('IF', (args) => {
  const condition = one(args, 0);
  return isFormulaError(condition) ? condition : condition ? (args[1] ?? true) as FormulaValue : (args[2] ?? false) as FormulaValue;
});
define('IFS', (args) => {
  for (let index = 0; index + 1 < args.length; index += 2) {
    const condition = one(args, index);
    if (isFormulaError(condition)) return condition;
    if (condition) return args[index + 1] as FormulaValue;
  }
  return ERR.na();
});
define('AND', (args) => flatten(args).every((value) => isFormulaError(value) ? false : Boolean(value)));
define('OR', (args) => flatten(args).some((value) => isFormulaError(value) ? false : Boolean(value)));
define('XOR', (args) => flatten(args).filter((value) => !isFormulaError(value) && Boolean(value)).length % 2 === 1);
define('NOT', (args) => !Boolean(one(args)));
define('TRUE', () => true);
define('FALSE', () => false);
define('IFERROR', (args) => isFormulaError(args[0]) ? (args[1] ?? null) as FormulaValue : (args[0] ?? null) as FormulaValue);
define('IFNA', (args) => isFormulaError(args[0]) && (args[0] as FormulaError).code === '#N/A' ? (args[1] ?? null) as FormulaValue : (args[0] ?? null) as FormulaValue);
define('SWITCH', (args) => {
  const target = one(args, 0);
  for (let index = 1; index + 1 < args.length; index += 2) {
    if (compare(target, one(args, index)) === 0) return args[index + 1] as FormulaValue;
  }
  return args.length % 2 === 0 ? args[args.length - 1] as FormulaValue : ERR.na();
});

define('CONCAT', (args) => flatten(args).map((value) => text(value)).join(''));
define('CONCATENATE', (args) => flatten(args).map((value) => text(value)).join(''));
define('LEFT', (args) => text(one(args, 0)).slice(0, one(args, 1) === null ? 1 : numeric(one(args, 1)) as number));
define('RIGHT', (args) => {
  const value = text(one(args, 0));
  const count = one(args, 1) === null ? 1 : numeric(one(args, 1)) as number;
  return count <= 0 ? '' : value.slice(-count);
});
define('MID', (args) => text(one(args, 0)).substr((numeric(one(args, 1)) as number) - 1, numeric(one(args, 2)) as number));
define('LEN', (args) => text(one(args, 0)).length);
define('LOWER', (args) => text(one(args, 0)).toLowerCase());
define('UPPER', (args) => text(one(args, 0)).toUpperCase());
define('PROPER', (args) => text(one(args, 0)).replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()));
define('TRIM', (args) => text(one(args, 0)).trim().replace(/\s+/g, ' '));
define('REPT', (args) => text(one(args, 0)).repeat(Math.max(0, numeric(one(args, 1)) as number)));
define('EXACT', (args) => text(one(args, 0)) === text(one(args, 1)));
define('FIND', (args) => {
  const needle = text(one(args, 0)); const haystack = text(one(args, 1));
  const index = haystack.indexOf(needle);
  return index < 0 ? ERR.value() : index + 1;
});
define('SEARCH', (args) => {
  const needle = text(one(args, 0)).toLowerCase(); const haystack = text(one(args, 1)).toLowerCase();
  const index = haystack.indexOf(needle);
  return index < 0 ? ERR.value() : index + 1;
});
define('SUBSTITUTE', (args) => text(one(args, 0)).split(text(one(args, 1))).join(text(one(args, 2))));
define('REPLACE', (args) => {
  const value = text(one(args, 0));
  const start = numeric(one(args, 1)) as number;
  const count = numeric(one(args, 2)) as number;
  return value.slice(0, start - 1) + text(one(args, 3)) + value.slice(start - 1 + count);
});
define('TEXT', (args) => {
  const value = one(args, 0); const format = text(one(args, 1));
  if (isFormulaError(value)) return value;
  if (typeof value === 'number') {
    if (/0\.0+/.test(format)) return value.toFixed((format.split('.')[1] ?? '').length);
    if (/#,##0/.test(format)) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (/[yYmMdD]/.test(format)) return formatDate(value, format);
  }
  return text(value);
});
define('VALUE', (args) => {
  const value = one(args, 0);
  if (typeof value === 'number') return value;
  const parsed = Number(text(value).replace(/[,$%\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : ERR.value();
});
define('CHAR', (args) => String.fromCharCode(numeric(one(args)) as number));
define('CODE', (args) => text(one(args, 0)).charCodeAt(0) || ERR.value());

define('VLOOKUP', (args) => {
  const lookup = one(args, 0);
  const table = matrix(args[1] ?? null); if (isFormulaError(table)) return table;
  const col = numeric(one(args, 2)) as number;
  const approximate = Boolean(one(args, 3));
  let best: FormulaValue = ERR.na();
  for (const row of table) {
    const key = row[0];
    if (compare(key, lookup) === 0) return row[col - 1] ?? ERR.ref();
    if (approximate && compare(key, lookup) < 0) best = row[col - 1] ?? best;
  }
  return approximate ? best : ERR.na();
});
define('HLOOKUP', (args) => {
  const lookup = one(args, 0);
  const table = matrix(args[1] ?? null); if (isFormulaError(table)) return table;
  const rowIndex = numeric(one(args, 2)) as number;
  const header = table[0] ?? [];
  for (let col = 0; col < header.length; col++) {
    if (compare(header[col], lookup) === 0) return table[rowIndex - 1]?.[col] ?? ERR.ref();
  }
  return ERR.na();
});
define('INDEX', (args) => {
  const table = matrix(args[0] ?? null); if (isFormulaError(table)) return table;
  const row = numeric(one(args, 1)) as number;
  const col = one(args, 2) === null ? 1 : numeric(one(args, 2)) as number;
  return table[row - 1]?.[col - 1] ?? ERR.ref();
});
define('MATCH', (args) => {
  const lookup = one(args, 0);
  const values = flatten([args[1] ?? null]);
  for (let index = 0; index < values.length; index++) if (compare(values[index], lookup) === 0) return index + 1;
  return ERR.na();
});
define('XLOOKUP', (args) => {
  const lookup = one(args, 0);
  const lookupValues = flatten([args[1] ?? null]);
  const returnValues = flatten([args[2] ?? null]);
  for (let index = 0; index < lookupValues.length; index++) {
    if (compare(lookupValues[index], lookup) === 0) return returnValues[index] ?? ERR.na();
  }
  return (args[3] ?? ERR.na()) as FormulaValue;
});
define('CHOOSE', (args) => {
  const index = numeric(one(args, 0)) as number;
  const value = args[index];
  return value === undefined ? ERR.value() : scalar(value);
});

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
function toSerial(date: Date): number { return (date.getTime() - EXCEL_EPOCH) / 86400000; }
function fromSerial(serial: number): Date { return new Date(EXCEL_EPOCH + serial * 86400000); }
function dateArg(value: FormulaValue): Date | FormulaError {
  if (isFormulaError(value)) return value;
  if (typeof value === 'number') return fromSerial(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? ERR.value() : parsed;
  }
  return ERR.value();
}
function formatDate(serial: number, format: string): string {
  const date = fromSerial(serial);
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return format.replace(/yyyy/g, yyyy).replace(/mm/g, mm).replace(/dd/g, dd);
}

define('TODAY', () => toSerial(new Date()));
define('NOW', () => toSerial(new Date()));
define('DATE', (args) => toSerial(new Date(Date.UTC(numeric(one(args, 0)) as number, (numeric(one(args, 1)) as number) - 1, numeric(one(args, 2)) as number))));
define('YEAR', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCFullYear(); });
define('MONTH', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCMonth() + 1; });
define('DAY', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCDate(); });
define('HOUR', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCHours(); });
define('MINUTE', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCMinutes(); });
define('SECOND', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCSeconds(); });
define('WEEKDAY', (args) => { const d = dateArg(one(args)); return isFormulaError(d) ? d : d.getUTCDay() + 1; });
define('DAYS', (args) => { const end = dateArg(one(args, 0)); const start = dateArg(one(args, 1)); if (isFormulaError(end)) return end; if (isFormulaError(start)) return start; return Math.round((end.getTime() - start.getTime()) / 86400000); });
define('EDATE', (args) => { const d = dateArg(one(args, 0)); if (isFormulaError(d)) return d; const result = new Date(d.getTime()); result.setUTCMonth(result.getUTCMonth() + (numeric(one(args, 1)) as number)); return toSerial(result); });
define('EOMONTH', (args) => { const d = dateArg(one(args, 0)); if (isFormulaError(d)) return d; const result = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (numeric(one(args, 1)) as number) + 1, 0)); return toSerial(result); });

define('ISBLANK', (args) => one(args) === null || one(args) === '');
define('ISERROR', (args) => isFormulaError(one(args)));
define('ISNUMBER', (args) => typeof one(args) === 'number');
define('ISTEXT', (args) => typeof one(args) === 'string');
define('ISLOGICAL', (args) => typeof one(args) === 'boolean');
define('ISEVEN', (args) => { const n = numeric(one(args)); return isFormulaError(n) ? n : n % 2 === 0; });
define('ISODD', (args) => { const n = numeric(one(args)); return isFormulaError(n) ? n : Math.abs(n % 2) === 1; });
define('N', (args) => numeric(one(args)));

define('FV', (args) => {
  const rate = numeric(one(args, 0)) as number; const nper = numeric(one(args, 1)) as number;
  const pmt = numeric(one(args, 2)) as number; const pv = one(args, 3) === null ? 0 : numeric(one(args, 3)) as number;
  const type = one(args, 4) === null ? 0 : numeric(one(args, 4)) as number;
  if (rate === 0) return -(pv + pmt * nper);
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + pmt * (1 + rate * type) * (factor - 1) / rate);
});
define('PV', (args) => {
  const rate = numeric(one(args, 0)) as number; const nper = numeric(one(args, 1)) as number;
  const pmt = numeric(one(args, 2)) as number; const fv = one(args, 3) === null ? 0 : numeric(one(args, 3)) as number;
  return rate === 0 ? -(fv + pmt * nper) : -(fv + pmt * (Math.pow(1 + rate, nper) - 1) / rate) / Math.pow(1 + rate, nper);
});
define('PMT', (args) => {
  const rate = numeric(one(args, 0)) as number; const nper = numeric(one(args, 1)) as number;
  const pv = numeric(one(args, 2)) as number; const fv = one(args, 3) === null ? 0 : numeric(one(args, 3)) as number;
  if (rate === 0) return -(pv + fv) / nper;
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + fv) * rate / (factor - 1);
});
define('NPV', (args) => {
  const rate = numeric(one(args, 0)) as number;
  const values = numbers(args.slice(1));
  if (isFormulaError(values)) return values;
  return values.reduce((total, value, index) => total + value / Math.pow(1 + rate, index + 1), 0);
});

/* -------------------- extended catalogue (math/stats/text/date) ---------- */
const sortedValues = (args: EvalValue[]): number[] | FormulaError => {
  const values = numbers(args);
  return isFormulaError(values) ? values : [...values].sort((a, b) => a - b);
};
const pairValues = (a: EvalValue, b: EvalValue): { a: number[]; b: number[] } | FormulaError => {
  const left = numbers([a]);
  if (isFormulaError(left)) return left;
  const right = numbers([b]);
  if (isFormulaError(right)) return right;
  if (left.length !== right.length || !left.length) return ERR.na();
  return { a: left, b: right };
};

define('SUMSQ', (args) => { const v = numbers(args); return isFormulaError(v) ? v : v.reduce((s, x) => s + x * x, 0); });
define('SUMX2MY2', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; return p.a.reduce((s, x, i) => s + x * x - p.b[i] * p.b[i], 0); });
define('SUMX2PY2', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; return p.a.reduce((s, x, i) => s + x * x + p.b[i] * p.b[i], 0); });
define('SUMXMY2', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; return p.a.reduce((s, x, i) => s + (x - p.b[i]) ** 2, 0); });
define('GCD', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b); return v.reduce((g, x) => gcd(g, Math.trunc(x)), 0); });
define('LCM', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b); return v.reduce((l, x) => Math.abs(l * Math.trunc(x)) / (gcd(l, Math.trunc(x)) || 1), 1); });
const factorial = (n: number): number => { let value = 1; for (let i = 2; i <= Math.floor(n); i++) value *= i; return value; };
define('FACT', (args) => { const n = numeric(one(args)); return isFormulaError(n) ? n : n < 0 ? ERR.num() : factorial(n); });
define('FACTDOUBLE', (args) => { const n = numeric(one(args)); if (isFormulaError(n)) return n; let value = 1; for (let i = Math.floor(n); i > 1; i -= 2) value *= i; return value; });
define('COMBIN', (args) => { const n = numeric(one(args, 0)) as number; const k = numeric(one(args, 1)) as number; return factorial(n) / (factorial(k) * factorial(n - k)); });
define('COMBINA', (args) => { const n = numeric(one(args, 0)) as number; const k = numeric(one(args, 1)) as number; return factorial(n + k - 1) / (factorial(k) * factorial(n - 1)); });
define('PERMUT', (args) => { const n = numeric(one(args, 0)) as number; const k = numeric(one(args, 1)) as number; return factorial(n) / factorial(n - k); });
define('MULTINOMIAL', (args) => { const v = numbers(args); return isFormulaError(v) ? v : factorial(v.reduce((s, x) => s + x, 0)) / v.reduce((p, x) => p * factorial(x), 1); });
define('QUOTIENT', (args) => { const a = numeric(one(args, 0)) as number; const b = numeric(one(args, 1)) as number; return b === 0 ? ERR.div0() : Math.trunc(a / b); });
define('EVEN', (args) => { const n = numeric(one(args)); return isFormulaError(n) ? n : Math.sign(n) * Math.ceil(Math.abs(n) / 2) * 2; });
define('ODD', (args) => { const n = numeric(one(args)); if (isFormulaError(n)) return n; const abs = Math.abs(n); const rounded = abs % 2 === 0 ? abs + 1 : abs; return Math.sign(n) * rounded; });
define('MROUND', (args) => { const n = numeric(one(args, 0)) as number; const m = numeric(one(args, 1)) as number; return m === 0 ? 0 : Math.round(n / m) * m; });
define('RAND', () => Math.random());
define('RANDBETWEEN', (args) => { const low = numeric(one(args, 0)) as number; const high = numeric(one(args, 1)) as number; return Math.floor(Math.random() * (high - low + 1)) + low; });
define('BASE', (args) => { const n = Math.trunc(numeric(one(args, 0)) as number); const radix = Math.trunc(numeric(one(args, 1)) as number); return n.toString(radix).toUpperCase(); });
define('DECIMAL', (args) => { const value = text(one(args, 0)); const radix = Math.trunc(numeric(one(args, 1)) as number); const parsed = parseInt(value, radix); return Number.isFinite(parsed) ? parsed : ERR.num(); });
define('ROMAN', (args) => { let n = Math.trunc(numeric(one(args)) as number); if (n <= 0) return ''; const map: Array<[number, string]> = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let out=''; for (const [value, symbol] of map) { while (n >= value) { out += symbol; n -= value; } } return out; });
define('ARABIC', (args) => { const value = text(one(args, 0)).toUpperCase(); const map: Record<string, number> = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 }; let total=0; for (let i=0;i<value.length;i++) { const current=map[value[i]]??0; const next=map[value[i+1]]??0; total += current < next ? -current : current; } return total; });
define('BITAND', (args) => (numeric(one(args, 0)) as number) & (numeric(one(args, 1)) as number));
define('BITOR', (args) => (numeric(one(args, 0)) as number) | (numeric(one(args, 1)) as number));
define('BITXOR', (args) => (numeric(one(args, 0)) as number) ^ (numeric(one(args, 1)) as number));
define('BITLSHIFT', (args) => (numeric(one(args, 0)) as number) << (numeric(one(args, 1)) as number));
define('BITRSHIFT', (args) => (numeric(one(args, 0)) as number) >> (numeric(one(args, 1)) as number));
define('SQRTPI', (args) => Math.sqrt(Math.PI * (numeric(one(args)) as number)));
define('SERIESSUM', (args) => { const x = numeric(one(args, 0)) as number; const n = numeric(one(args, 1)) as number; const m = numeric(one(args, 2)) as number; const coeffs = numbers(args.slice(3)); if (isFormulaError(coeffs)) return coeffs; return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, n + i * m), 0); });
define('SEC', (args) => 1 / Math.cos(numeric(one(args)) as number));
define('CSC', (args) => 1 / Math.sin(numeric(one(args)) as number));
define('COT', (args) => 1 / Math.tan(numeric(one(args)) as number));
define('SECH', (args) => 1 / Math.cosh(numeric(one(args)) as number));
define('CSCH', (args) => 1 / Math.sinh(numeric(one(args)) as number));
define('COTH', (args) => 1 / Math.tanh(numeric(one(args)) as number));
define('SINH', (args) => Math.sinh(numeric(one(args)) as number));
define('COSH', (args) => Math.cosh(numeric(one(args)) as number));
define('TANH', (args) => Math.tanh(numeric(one(args)) as number));
define('ASINH', (args) => Math.asinh(numeric(one(args)) as number));
define('ACOSH', (args) => Math.acosh(numeric(one(args)) as number));
define('ATANH', (args) => Math.atanh(numeric(one(args)) as number));

define('STDEV.S', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (v.length < 2) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1)); });
define('STDEV.P', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (!v.length) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length); });
define('VAR.S', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (v.length < 2) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1); });
define('VAR.P', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (!v.length) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length; });
define('STDEV', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (v.length < 2) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1)); });
define('STDEVP', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (!v.length) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length); });
define('VAR', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (v.length < 2) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1); });
define('VARP', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (!v.length) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length; });
define('LARGE', (args) => { const v = sortedValues(args.slice(0, 1)); if (isFormulaError(v)) return v; const k = numeric(one(args, 1)) as number; return v[v.length - k] ?? ERR.num(); });
define('SMALL', (args) => { const v = sortedValues(args.slice(0, 1)); if (isFormulaError(v)) return v; const k = numeric(one(args, 1)) as number; return v[k - 1] ?? ERR.num(); });
define('RANK.EQ', (args) => { const value = numeric(one(args, 0)) as number; const v = numbers([args[1] ?? null]); if (isFormulaError(v)) return v; const sorted = [...v].sort((a, b) => (numeric(one(args, 2)) ? a - b : b - a)); return sorted.indexOf(value) + 1 || ERR.na(); });
define('RANK.AVG', (args) => { const value = numeric(one(args, 0)) as number; const v = numbers([args[1] ?? null]); if (isFormulaError(v)) return v; const sorted = [...v].sort((a, b) => (numeric(one(args, 2)) ? a - b : b - a)); const index = sorted.indexOf(value); return index < 0 ? ERR.na() : index + 1; });
define('RANK', (args) => { const value = numeric(one(args, 0)) as number; const v = numbers([args[1] ?? null]); if (isFormulaError(v)) return v; const sorted = [...v].sort((a, b) => (numeric(one(args, 2)) ? a - b : b - a)); return sorted.indexOf(value) + 1 || ERR.na(); });
const percentile = (v: number[], p: number): number => {
  const sorted = [...v].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index); const high = Math.ceil(index);
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
};
define('PERCENTILE.INC', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, numeric(one(args, 1)) as number); });
define('PERCENTILE.EXC', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, numeric(one(args, 1)) as number); });
define('PERCENTILE', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, numeric(one(args, 1)) as number); });
define('QUARTILE.INC', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, (numeric(one(args, 1)) as number) / 4); });
define('QUARTILE.EXC', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, (numeric(one(args, 1)) as number) / 4); });
define('QUARTILE', (args) => { const v = numbers(args.slice(0, 1)); if (isFormulaError(v)) return v; return percentile(v, (numeric(one(args, 1)) as number) / 4); });
define('MODE.SNGL', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const counts = new Map<number, number>(); for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1); let best = 0; let bestCount = 0; counts.forEach((count, value) => { if (count > bestCount) { best = value; bestCount = count; } }); return bestCount > 1 ? best : ERR.na(); });
define('MODE', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const counts = new Map<number, number>(); for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1); let best = 0; let bestCount = 0; counts.forEach((count, value) => { if (count > bestCount) { best = value; bestCount = count; } }); return bestCount > 1 ? best : ERR.na(); });
define('GEOMEAN', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; return v.length ? Math.pow(v.reduce((p, x) => p * x, 1), 1 / v.length) : ERR.num(); });
define('HARMEAN', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; return v.length ? v.length / v.reduce((s, x) => s + 1 / x, 0) : ERR.num(); });
define('DEVSQ', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - mean) ** 2, 0); });
define('AVEDEV', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const mean = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + Math.abs(x - mean), 0) / v.length; });
define('CORREL', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; const ma = p.a.reduce((s, x) => s + x, 0) / p.a.length; const mb = p.b.reduce((s, x) => s + x, 0) / p.b.length; let num = 0, da = 0, db = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - ma) * (p.b[i] - mb); da += (p.a[i] - ma) ** 2; db += (p.b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : ERR.div0(); });
define('PEARSON', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; const ma = p.a.reduce((s, x) => s + x, 0) / p.a.length; const mb = p.b.reduce((s, x) => s + x, 0) / p.b.length; let num = 0, da = 0, db = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - ma) * (p.b[i] - mb); da += (p.a[i] - ma) ** 2; db += (p.b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : ERR.div0(); });
define('SLOPE', (args) => { const p = pairValues(args[1] ?? null, args[0] ?? null); if (isFormulaError(p)) return p; const mx = p.a.reduce((s, x) => s + x, 0) / p.a.length; const my = p.b.reduce((s, x) => s + x, 0) / p.b.length; let num = 0, den = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - mx) * (p.b[i] - my); den += (p.a[i] - mx) ** 2; } return den ? num / den : ERR.div0(); });
define('INTERCEPT', (args) => { const p = pairValues(args[1] ?? null, args[0] ?? null); if (isFormulaError(p)) return p; const mx = p.a.reduce((s, x) => s + x, 0) / p.a.length; const my = p.b.reduce((s, x) => s + x, 0) / p.b.length; let num = 0, den = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - mx) * (p.b[i] - my); den += (p.a[i] - mx) ** 2; } return den ? my - (num / den) * mx : ERR.div0(); });
define('RSQ', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; const ma = p.a.reduce((s, x) => s + x, 0) / p.a.length; const mb = p.b.reduce((s, x) => s + x, 0) / p.b.length; let num = 0, da = 0, db = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - ma) * (p.b[i] - mb); da += (p.a[i] - ma) ** 2; db += (p.b[i] - mb) ** 2; } return da && db ? (num * num) / (da * db) : ERR.div0(); });
define('FORECAST.LINEAR', (args) => { const x = numeric(one(args, 0)) as number; const p = pairValues(args[2] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; const mx = p.a.reduce((s, v) => s + v, 0) / p.a.length; const my = p.b.reduce((s, v) => s + v, 0) / p.b.length; let num = 0, den = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - mx) * (p.b[i] - my); den += (p.a[i] - mx) ** 2; } return den ? my + (num / den) * (x - mx) : ERR.div0(); });
define('FORECAST', (args) => { const x = numeric(one(args, 0)) as number; const p = pairValues(args[2] ?? null, args[1] ?? null); if (isFormulaError(p)) return p; const mx = p.a.reduce((s, v) => s + v, 0) / p.a.length; const my = p.b.reduce((s, v) => s + v, 0) / p.b.length; let num = 0, den = 0; for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - mx) * (p.b[i] - my); den += (p.a[i] - mx) ** 2; } return den ? my + (num / den) * (x - mx) : ERR.div0(); });

define('COUNTIFS', (args) => {
  const first = matrix(args[0] ?? null); if (isFormulaError(first)) return first;
  let count = 0;
  for (let r = 0; r < first.length; r++) for (let c = 0; c < (first[r]?.length ?? 0); c++) {
    let match = true;
    for (let index = 0; index + 1 < args.length; index += 2) {
      const range = matrix(args[index]); if (isFormulaError(range)) { match = false; break; }
      if (!criteriaMatches(range[r]?.[c] ?? null, one(args, index + 1))) { match = false; break; }
    }
    if (match) count++;
  }
  return count;
});
define('AVERAGEIFS', (args) => {
  const values = matrix(args[0] ?? null); if (isFormulaError(values)) return values;
  let total = 0, count = 0;
  for (let r = 0; r < values.length; r++) for (let c = 0; c < (values[r]?.length ?? 0); c++) {
    let match = true;
    for (let index = 1; index + 1 < args.length; index += 2) {
      const range = matrix(args[index]); if (isFormulaError(range)) { match = false; break; }
      if (!criteriaMatches(range[r]?.[c] ?? null, one(args, index + 1))) { match = false; break; }
    }
    const value = values[r]?.[c];
    if (match && typeof value === 'number') { total += value; count++; }
  }
  return count ? total / count : ERR.div0();
});
define('MAXIFS', (args) => {
  const values = matrix(args[0] ?? null); if (isFormulaError(values)) return values;
  const picked: number[] = [];
  for (let r = 0; r < values.length; r++) for (let c = 0; c < (values[r]?.length ?? 0); c++) {
    let match = true;
    for (let index = 1; index + 1 < args.length; index += 2) {
      const range = matrix(args[index]); if (isFormulaError(range)) { match = false; break; }
      if (!criteriaMatches(range[r]?.[c] ?? null, one(args, index + 1))) { match = false; break; }
    }
    const value = values[r]?.[c];
    if (match && typeof value === 'number') picked.push(value);
  }
  return picked.length ? Math.max(...picked) : 0;
});
define('MINIFS', (args) => {
  const values = matrix(args[0] ?? null); if (isFormulaError(values)) return values;
  const picked: number[] = [];
  for (let r = 0; r < values.length; r++) for (let c = 0; c < (values[r]?.length ?? 0); c++) {
    let match = true;
    for (let index = 1; index + 1 < args.length; index += 2) {
      const range = matrix(args[index]); if (isFormulaError(range)) { match = false; break; }
      if (!criteriaMatches(range[r]?.[c] ?? null, one(args, index + 1))) { match = false; break; }
    }
    const value = values[r]?.[c];
    if (match && typeof value === 'number') picked.push(value);
  }
  return picked.length ? Math.min(...picked) : 0;
});
define('SKEW', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const n = v.length; if (n < 3) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / n; const s = Math.sqrt(v.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1)); return (n / ((n - 1) * (n - 2))) * v.reduce((sum, x) => sum + ((x - mean) / s) ** 3, 0); });
define('KURT', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; const n = v.length; if (n < 4) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / n; const s = Math.sqrt(v.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1)); const part = v.reduce((sum, x) => sum + ((x - mean) / s) ** 4, 0); return (n * (n + 1) * part) / ((n - 1) * (n - 2) * (n - 3)) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)); });
define('TRIMMEAN', (args) => { const v = sortedValues(args.slice(0, 1)); if (isFormulaError(v)) return v; const p = numeric(one(args, 1)) as number; const trim = Math.floor(v.length * p / 2); const kept = v.slice(trim, v.length - trim); return kept.reduce((s, x) => s + x, 0) / kept.length; });

define('TEXTJOIN', (args) => { const delimiter = text(one(args, 0)); const ignore = Boolean(one(args, 1)); const parts = flatten(args.slice(2)).map((value) => text(value)); return parts.filter((part) => !ignore || part !== '').join(delimiter); });
define('CLEAN', (args) => text(one(args, 0)).replace(/[\u0000-\u001f]/g, ''));
define('T', (args) => typeof one(args, 0) === 'string' ? one(args, 0) : '');
define('UNICHAR', (args) => String.fromCodePoint(numeric(one(args)) as number));
define('UNICODE', (args) => text(one(args, 0)).codePointAt(0) ?? ERR.value());
define('NUMBERVALUE', (args) => { const value = text(one(args, 0)).replace(/\s/g, '').replace(/,/g, ''); const parsed = Number(value); return Number.isFinite(parsed) ? parsed : ERR.value(); });
define('DOLLAR', (args) => { const value = numeric(one(args, 0)) as number; const digits = one(args, 1) === null ? 2 : numeric(one(args, 1)) as number; return `$${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`; });
define('FIXED', (args) => { const value = numeric(one(args, 0)) as number; const digits = one(args, 1) === null ? 2 : numeric(one(args, 1)) as number; return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }); });
define('TEXTBEFORE', (args) => { const value = text(one(args, 0)); const delimiter = text(one(args, 1)); const index = value.indexOf(delimiter); return index < 0 ? ERR.na() : value.slice(0, index); });
define('TEXTAFTER', (args) => { const value = text(one(args, 0)); const delimiter = text(one(args, 1)); const index = value.indexOf(delimiter); return index < 0 ? ERR.na() : value.slice(index + delimiter.length); });
define('VALUETOTEXT', (args) => text(one(args, 0)));
define('ARRAYTOTEXT', (args) => flatten(args).map((value) => text(value)).join(', '));

define('DATEVALUE', (args) => { const parsed = Date.parse(text(one(args, 0))); return Number.isFinite(parsed) ? toSerial(new Date(parsed)) : ERR.value(); });
define('TIME', (args) => ((numeric(one(args, 0)) as number) * 3600 + (numeric(one(args, 1)) as number) * 60 + (numeric(one(args, 2)) as number)) / 86400);
define('TIMEVALUE', (args) => { const parsed = Date.parse(`1970-01-01T${text(one(args, 0))}`); return Number.isFinite(parsed) ? (parsed % 86400000) / 86400000 : ERR.value(); });
const isWeekend = (date: Date): boolean => date.getUTCDay() === 0 || date.getUTCDay() === 6;
const weekendDays = (mask: FormulaValue): number[] => {
  if (typeof mask === 'number') {
    const maps: Record<number, number[]> = {
      1: [0, 6], 2: [1, 0], 3: [2, 1], 4: [3, 2], 5: [4, 3], 6: [5, 4], 7: [6, 5],
      11: [0], 12: [1], 13: [2], 14: [3], 15: [4], 16: [5], 17: [6],
    };
    return maps[mask] ?? [0, 6];
  }
  const pattern = String(mask ?? '');
  if (/^[01]{7}$/.test(pattern)) {
    const days: number[] = [];
    for (let i = 0; i < 7; i++) if (pattern[i] === '1') days.push((i + 1) % 7);
    return days.length ? days : [0, 6];
  }
  return [0, 6];
};
define('WORKDAY', (args) => { let current = dateArg(one(args, 0)); if (isFormulaError(current)) return current; const days = Math.trunc(numeric(one(args, 1)) as number); const holidays = new Set<number>(); flatten([args[2] ?? null]).forEach((value) => { if (typeof value === 'number') holidays.add(value); }); let remaining = Math.abs(days); const step = days < 0 ? -1 : 1; while (remaining > 0) { current = new Date(current.getTime() + step * 86400000); const serial = toSerial(current); if (!isWeekend(current) && !holidays.has(Math.floor(serial))) remaining--; } return toSerial(current); });
define('NETWORKDAYS', (args) => { const start = dateArg(one(args, 0)); const end = dateArg(one(args, 1)); if (isFormulaError(start)) return start; if (isFormulaError(end)) return end; const holidays = new Set<number>(); flatten([args[2] ?? null]).forEach((value) => { if (typeof value === 'number') holidays.add(value); }); let count = 0; const direction = start <= end ? 1 : -1; const cursor = new Date(start.getTime()); while ((direction > 0 && cursor <= end) || (direction < 0 && cursor >= end)) { if (!isWeekend(cursor) && !holidays.has(Math.floor(toSerial(cursor)))) count += direction; cursor.setUTCDate(cursor.getUTCDate() + direction); } return count; });
define('YEARFRAC', (args) => { const start = dateArg(one(args, 0)); const end = dateArg(one(args, 1)); if (isFormulaError(start)) return start; if (isFormulaError(end)) return end; return (end.getTime() - start.getTime()) / (365.25 * 86400000); });
define('WEEKNUM', (args) => { const date = dateArg(one(args, 0)); if (isFormulaError(date)) return date; const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1)); return Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) / 7); });
define('ISOWEEKNUM', (args) => { const date = dateArg(one(args, 0)); if (isFormulaError(date)) return date; const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1)); return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7); });
define('DATEDIF', (args) => { const start = dateArg(one(args, 0)); const end = dateArg(one(args, 1)); if (isFormulaError(start)) return start; if (isFormulaError(end)) return end; const unit = text(one(args, 2)).toUpperCase(); if (unit === 'Y') return end.getUTCFullYear() - start.getUTCFullYear(); if (unit === 'M') return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth(); if (unit === 'D') return Math.round((end.getTime() - start.getTime()) / 86400000); return ERR.value(); });
define('DAYS360', (args) => { const start = dateArg(one(args, 0)); const end = dateArg(one(args, 1)); if (isFormulaError(start)) return start; if (isFormulaError(end)) return end; return (end.getUTCFullYear() - start.getUTCFullYear()) * 360 + (end.getUTCMonth() - start.getUTCMonth()) * 30 + (end.getUTCDate() - start.getUTCDate()); });

define('LOOKUP', (args) => { const lookup = one(args, 0); const lookupRange = flatten([args[1] ?? null]); const resultRange: FormulaValue[] = args[2] === undefined || args[2] === null ? lookupRange : flatten([args[2]]); let found: FormulaValue = ERR.na(); let foundIndex = -1; for (let i = 0; i < lookupRange.length; i++) { if (compare(lookupRange[i], lookup) <= 0) { found = resultRange[i] ?? found; foundIndex = i; } } return foundIndex >= 0 ? found : ERR.na(); });
define('XMATCH', (args) => { const lookup = one(args, 0); const values = flatten([args[1] ?? null]); for (let i = 0; i < values.length; i++) { if (compare(values[i], lookup) === 0) return i + 1; } return ERR.na(); });

define('IPMT', (args) => { const rate = numeric(one(args, 0)) as number; const per = numeric(one(args, 1)) as number; const nper = numeric(one(args, 2)) as number; const pv = numeric(one(args, 3)) as number; const fv = one(args, 4) === null ? 0 : numeric(one(args, 4)) as number; const type = one(args, 5) === null ? 0 : numeric(one(args, 5)) as number; const pmt = rate === 0 ? -(pv + fv) / nper : -(pv * Math.pow(1 + rate, nper) + fv) * rate / (Math.pow(1 + rate, nper) - 1); const balance = rate === 0 ? pv : pv * Math.pow(1 + rate, per - 1) + pmt * (1 + rate * type) * (Math.pow(1 + rate, per - 1) - 1) / rate; return balance * rate; });
define('PPMT', (args) => { const rate = numeric(one(args, 0)) as number; const per = numeric(one(args, 1)) as number; const nper = numeric(one(args, 2)) as number; const pv = numeric(one(args, 3)) as number; const fv = one(args, 4) === null ? 0 : numeric(one(args, 4)) as number; const type = one(args, 5) === null ? 0 : numeric(one(args, 5)) as number; const pmt = rate === 0 ? -(pv + fv) / nper : -(pv * Math.pow(1 + rate, nper) + fv) * rate / (Math.pow(1 + rate, nper) - 1); const balance = rate === 0 ? pv : pv * Math.pow(1 + rate, per - 1) + pmt * (1 + rate * type) * (Math.pow(1 + rate, per - 1) - 1) / rate; return pmt - balance * rate; });
define('NPER', (args) => { const rate = numeric(one(args, 0)) as number; const pmt = numeric(one(args, 1)) as number; const pv = numeric(one(args, 2)) as number; const fv = one(args, 3) === null ? 0 : numeric(one(args, 3)) as number; if (rate === 0) return -(pv + fv) / pmt; return Math.log((pmt - fv * rate) / (pv * rate + pmt)) / Math.log(1 + rate); });
define('RATE', (args) => { const nper = numeric(one(args, 0)) as number; const pmt = numeric(one(args, 1)) as number; const pv = numeric(one(args, 2)) as number; const fv = one(args, 3) === null ? 0 : numeric(one(args, 3)) as number; let rate = one(args, 4) === null ? 0.1 : numeric(one(args, 4)) as number; for (let i = 0; i < 100; i++) { const factor = Math.pow(1 + rate, nper); const f = pv * factor + pmt * (factor - 1) / rate + fv; const df = pv * nper * Math.pow(1 + rate, nper - 1) + pmt * ((nper * Math.pow(1 + rate, nper - 1) * rate - (factor - 1)) / (rate * rate)); const next = rate - f / df; if (Math.abs(next - rate) < 1e-9) return next; rate = next; } return rate; });
define('IRR', (args) => { const values = numbers(args.slice(0, 1)); if (isFormulaError(values)) return values; let rate = one(args, 1) === null ? 0.1 : numeric(one(args, 1)) as number; for (let iteration = 0; iteration < 100; iteration++) { let npv = 0; let derivative = 0; for (let i = 0; i < values.length; i++) { npv += values[i] / Math.pow(1 + rate, i); derivative -= i * values[i] / Math.pow(1 + rate, i + 1); } const next = rate - npv / derivative; if (Math.abs(next - rate) < 1e-9) return next; rate = next; } return rate; });
define('XIRR', (args) => { const cash = numbers(args.slice(0, 1)); const dates = numbers(args.slice(1, 2)); if (isFormulaError(cash) || isFormulaError(dates)) return ERR.value(); let rate = 0.1; for (let iteration = 0; iteration < 100; iteration++) { let npv = 0; let derivative = 0; const base = dates[0]; for (let i = 0; i < cash.length; i++) { const years = (dates[i] - base) / 365; npv += cash[i] / Math.pow(1 + rate, years); derivative -= years * cash[i] / Math.pow(1 + rate, years + 1); } const next = rate - npv / derivative; if (Math.abs(next - rate) < 1e-9) return next; rate = next; } return rate; });
define('SLN', (args) => { const cost = numeric(one(args, 0)) as number; const salvage = numeric(one(args, 1)) as number; const life = numeric(one(args, 2)) as number; return life === 0 ? ERR.div0() : (cost - salvage) / life; });
define('SYD', (args) => { const cost = numeric(one(args, 0)) as number; const salvage = numeric(one(args, 1)) as number; const life = numeric(one(args, 2)) as number; const per = numeric(one(args, 3)) as number; return (cost - salvage) * (life - per + 1) * 2 / (life * (life + 1)); });
define('DB', (args) => { const cost = numeric(one(args, 0)) as number; const salvage = numeric(one(args, 1)) as number; const life = numeric(one(args, 2)) as number; const period = numeric(one(args, 3)) as number; const month = one(args, 4) === null ? 12 : numeric(one(args, 4)) as number; const rate = 1 - Math.pow(salvage / cost, 1 / life); let value = cost; for (let i = 1; i <= period; i++) { const depreciation = i === 1 ? value * rate * month / 12 : value * rate; value -= depreciation; if (i === period) return depreciation; } return 0; });
define('DDB', (args) => { const cost = numeric(one(args, 0)) as number; const salvage = numeric(one(args, 1)) as number; const life = numeric(one(args, 2)) as number; const period = numeric(one(args, 3)) as number; const factor = one(args, 4) === null ? 2 : numeric(one(args, 4)) as number; let value = cost; for (let i = 1; i <= period; i++) { const depreciation = Math.min(value * factor / life, value - salvage); value -= depreciation; if (i === period) return depreciation; } return 0; });
define('EFFECT', (args) => { const nominal = numeric(one(args, 0)) as number; const periods = numeric(one(args, 1)) as number; return Math.pow(1 + nominal / periods, periods) - 1; });
define('NOMINAL', (args) => { const effect = numeric(one(args, 0)) as number; const periods = numeric(one(args, 1)) as number; return (Math.pow(1 + effect, 1 / periods) - 1) * periods; });
define('PDURATION', (args) => { const rate = numeric(one(args, 0)) as number; const pv = numeric(one(args, 1)) as number; const fv = numeric(one(args, 2)) as number; return Math.log(fv / pv) / Math.log(1 + rate); });
define('RRI', (args) => { const nper = numeric(one(args, 0)) as number; const pv = numeric(one(args, 1)) as number; const fv = numeric(one(args, 2)) as number; return Math.pow(fv / pv, 1 / nper) - 1; });
define('FVSCHEDULE', (args) => { const principal = numeric(one(args, 0)) as number; const rates = numbers(args.slice(1)); if (isFormulaError(rates)) return rates; return rates.reduce((value, rate) => value * (1 + rate), principal); });

define('ISERR', (args) => { const value = one(args); return isFormulaError(value) && value.code !== '#N/A'; });
define('ISNA', (args) => { const value = one(args); return isFormulaError(value) && value.code === '#N/A'; });
define('ISREF', () => false);
define('ISFORMULA', () => false);
define('NA', () => ERR.na());
define('TYPE', (args) => { const value = one(args); if (isFormulaError(value)) return 16; if (typeof value === 'number') return 1; if (typeof value === 'string') return 2; if (typeof value === 'boolean') return 4; return 1; });
define('ERROR.TYPE', (args) => { const value = one(args); if (!isFormulaError(value)) return ERR.na(); const order = ['#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A']; const index = order.indexOf(value.code); return index < 0 ? ERR.na() : index + 1; });
define('SHEET', () => 1);
define('SHEETS', () => 1);

define('DELTA', (args) => (numeric(one(args, 0)) as number) === (one(args, 1) === null ? 0 : numeric(one(args, 1)) as number) ? 1 : 0);
define('GESTEP', (args) => (numeric(one(args, 0)) as number) >= (one(args, 1) === null ? 0 : numeric(one(args, 1)) as number) ? 1 : 0);
const toBase = (value: number, radix: number, width?: number): string => { const output = Math.trunc(Math.abs(value)).toString(radix).toUpperCase(); return width ? output.padStart(width, '0') : output; };
define('DEC2BIN', (args) => toBase(numeric(one(args, 0)) as number, 2, one(args, 1) === null ? undefined : numeric(one(args, 1)) as number));
define('DEC2OCT', (args) => toBase(numeric(one(args, 0)) as number, 8, one(args, 1) === null ? undefined : numeric(one(args, 1)) as number));
define('DEC2HEX', (args) => toBase(numeric(one(args, 0)) as number, 16, one(args, 1) === null ? undefined : numeric(one(args, 1)) as number));
define('BIN2DEC', (args) => parseInt(text(one(args, 0)), 2));
define('OCT2DEC', (args) => parseInt(text(one(args, 0)), 8));
define('HEX2DEC', (args) => parseInt(text(one(args, 0)), 16));
define('BIN2HEX', (args) => parseInt(text(one(args, 0)), 2).toString(16).toUpperCase());
define('BIN2OCT', (args) => parseInt(text(one(args, 0)), 2).toString(8).toUpperCase());
define('OCT2BIN', (args) => parseInt(text(one(args, 0)), 8).toString(2));
define('OCT2HEX', (args) => parseInt(text(one(args, 0)), 8).toString(16).toUpperCase());
define('HEX2BIN', (args) => parseInt(text(one(args, 0)), 16).toString(2));
define('HEX2OCT', (args) => parseInt(text(one(args, 0)), 16).toString(8).toUpperCase());

/* ---------------------- database functions ------------------------------ */
const databaseResult = (args: EvalValue[], fn: (values: number[]) => FormulaValue): FormulaValue => {
  const db = matrix(args[0] ?? null); if (isFormulaError(db)) return db;
  if (db.length < 2) return ERR.value();
  const headers = db[0].map((value) => text(value).toLowerCase());
  const field = one(args, 1);
  const fieldIndex = typeof field === 'number' ? field - 1 : headers.indexOf(text(field).toLowerCase());
  if (fieldIndex < 0 || fieldIndex >= headers.length) return ERR.value();
  const criteria = matrix(args[2] ?? null); if (isFormulaError(criteria)) return criteria;
  if (!criteria.length) return fn([]);
  const criteriaHeaders = criteria[0];
  const selected: number[] = [];
  for (let row = 1; row < db.length; row++) {
    let match = false;
    for (let c = 1; c < criteria.length; c++) {
      let rowMatch = true;
      for (let col = 0; col < criteriaHeaders.length; col++) {
        const expected = criteria[c]?.[col];
        if (expected === null || expected === undefined || text(expected) === '') continue;
        const index = headers.indexOf(text(criteriaHeaders[col]).toLowerCase());
        if (index < 0 || !criteriaMatches(db[row]?.[index] ?? null, expected)) { rowMatch = false; break; }
      }
      if (rowMatch) { match = true; break; }
    }
    if (!match) continue;
    const value = db[row]?.[fieldIndex];
    if (typeof value === 'number') selected.push(value);
  }
  return fn(selected);
};
define('DSUM', (args) => databaseResult(args, (values) => values.reduce((s, x) => s + x, 0)));
define('DCOUNT', (args) => databaseResult(args, (values) => values.length));
define('DAVERAGE', (args) => databaseResult(args, (values) => values.length ? values.reduce((s, x) => s + x, 0) / values.length : ERR.div0()));
define('DMAX', (args) => databaseResult(args, (values) => values.length ? Math.max(...values) : 0));
define('DMIN', (args) => databaseResult(args, (values) => values.length ? Math.min(...values) : 0));
define('DPRODUCT', (args) => databaseResult(args, (values) => values.reduce((p, x) => p * x, 1)));
define('DVAR', (args) => databaseResult(args, (values) => { if (values.length < 2) return ERR.div0(); const mean = values.reduce((s, x) => s + x, 0) / values.length; return values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1); }));
define('DVARP', (args) => databaseResult(args, (values) => { if (!values.length) return ERR.div0(); const mean = values.reduce((s, x) => s + x, 0) / values.length; return values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length; }));

/* -------------------- extended catalogue v2 (math/text/date) ------------- */
const numArg = (args: EvalValue[], index: number, fallback?: number): number | FormulaError => {
  const value = one(args, index);
  if (value === null && fallback !== undefined) return fallback;
  return numeric(value);
};
const strArg = (args: EvalValue[], index: number): string => text(one(args, index));
const lnGamma = (value: number): number => {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  if (value < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * value)) - lnGamma(1 - value);
  let x = value - 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i++) a += coefficients[i] / (x + i + 1);
  const t = x + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
};
const gammaFn = (value: number): number => Math.exp(lnGamma(value));
const erfFn = (value: number): number => {
  if (value === 0) return 0;
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592)
    * t * Math.exp(-x * x);
  return sign * y;
};
const normCdf = (value: number): number => 0.5 * (1 + erfFn(value / Math.SQRT2));
const normPdf = (value: number): number => Math.exp(-value * value / 2) / Math.sqrt(2 * Math.PI);
const bisect = (fn: (value: number) => number, target: number, low: number, high: number): number => {
  let a = low;
  let b = high;
  for (let i = 0; i < 100; i++) {
    const mid = (a + b) / 2;
    if (fn(mid) < target) a = mid; else b = mid;
  }
  return (a + b) / 2;
};
const normInv = (probability: number): number => bisect(normCdf, probability, -10, 10);
const gammaSeries = (a: number, x: number): number => {
  let sum = 1 / a;
  let term = sum;
  for (let n = 1; n < 500; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
};
const gammaContinued = (a: number, x: number): number => {
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
};
const gammaP = (a: number, x: number): number => {
  if (x <= 0) return 0;
  return x < a + 1 ? gammaSeries(a, x) : 1 - gammaContinued(a, x);
};
const betaContinued = (a: number, b: number, x: number): number => {
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 500; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  return h;
};
const betaI = (a: number, b: number, x: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? front * betaContinued(a, b, x) / a
    : 1 - front * betaContinued(b, a, 1 - x) / b;
};

define('ACOT', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : Math.atan(1 / v); });
define('ACOTH', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : Math.abs(v) <= 1 ? ERR.num() : 0.5 * Math.log((v + 1) / (v - 1)); });
define('CEILING.MATH', (args) => { const v = numArg(args, 0); if (isFormulaError(v)) return v; const s = numArg(args, 1, 1) as number; const m = numArg(args, 2, 0) as number; const mode = m === 0 ? Math.ceil : Math.floor; return mode(v / Math.abs(s || 1)) * Math.abs(s || 1); });
define('CEILING.PRECISE', (args) => { const v = numArg(args, 0); if (isFormulaError(v)) return v; const s = Math.abs(numArg(args, 1, 1) as number) || 1; return Math.ceil(v / s) * s; });
define('FLOOR.MATH', (args) => { const v = numArg(args, 0); if (isFormulaError(v)) return v; const s = numArg(args, 1, 1) as number; const m = numArg(args, 2, 0) as number; const mode = m === 0 ? Math.floor : Math.ceil; return mode(v / Math.abs(s || 1)) * Math.abs(s || 1); });
define('FLOOR.PRECISE', (args) => { const v = numArg(args, 0); if (isFormulaError(v)) return v; const s = Math.abs(numArg(args, 1, 1) as number) || 1; return Math.floor(v / s) * s; });
define('ISO.CEILING', (args) => { const v = numArg(args, 0); if (isFormulaError(v)) return v; const s = Math.abs(numArg(args, 1, 1) as number) || 1; return Math.ceil(v / s) * s; });
define('GAMMA', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : gammaFn(v); });
define('GAMMALN', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : lnGamma(v); });
define('GAMMALN.PRECISE', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : lnGamma(v); });
define('ERF', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : erfFn(v); });
define('ERF.PRECISE', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : erfFn(v); });
define('ERFC', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : 1 - erfFn(v); });
define('ERFC.PRECISE', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : 1 - erfFn(v); });
define('PERMUTATIONA', (args) => { const n = numArg(args, 0) as number; const k = numArg(args, 1) as number; return Math.pow(Math.floor(n), Math.floor(k)); });
define('MDETERM', (args) => {
  const m = matrix(args[0] ?? null);
  if (isFormulaError(m)) return m;
  const size = m.length;
  if (!size || m.some((row) => row.length !== size)) return ERR.value();
  const a = m.map((row) => row.map((value) => Number(value) || 0));
  let det = 1;
  for (let i = 0; i < size; i++) {
    let pivot = i;
    for (let r = i + 1; r < size; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    if (Math.abs(a[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) { [a[i], a[pivot]] = [a[pivot], a[i]]; det = -det; }
    det *= a[i][i];
    for (let r = i + 1; r < size; r++) {
      const factor = a[r][i] / a[i][i];
      for (let c = i; c < size; c++) a[r][c] -= factor * a[i][c];
    }
  }
  return det;
});
const aggregateValues = (code: number, values: number[] | FormulaError): FormulaValue => {
  if (isFormulaError(values)) return values;
  const mean = values.length ? values.reduce((s, x) => s + x, 0) / values.length : 0;
  switch (code) {
    case 1: return values.length ? mean : ERR.div0();
    case 2: return values.length;
    case 3: return values.length;
    case 4: return values.length ? Math.max(...values) : 0;
    case 5: return values.length ? Math.min(...values) : 0;
    case 6: return values.reduce((p, x) => p * x, 1);
    case 7: return values.length > 1 ? Math.sqrt(values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1)) : ERR.div0();
    case 8: return values.length ? Math.sqrt(values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length) : ERR.div0();
    case 9: return values.reduce((s, x) => s + x, 0);
    case 10: return values.length > 1 ? values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1) : ERR.div0();
    case 11: return values.length ? values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length : ERR.div0();
    default: return ERR.value();
  }
};
define('SUBTOTAL', (args) => aggregateValues(Math.floor(numArg(args, 0) as number) % 100, numbers(args.slice(1))));
define('AGGREGATE', (args) => {
  const code = Math.floor(numArg(args, 0) as number);
  if (code === 12) {
    const values = numbers(args.slice(2));
    if (isFormulaError(values)) return values;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  if (code === 14 || code === 15) {
    const values = numbers(args.slice(2));
    if (isFormulaError(values)) return values;
    const sorted = [...values].sort((a, b) => a - b);
    const k = Math.floor(numArg(args, 3) as number);
    return code === 14 ? (sorted[sorted.length - k] ?? ERR.num()) : (sorted[k - 1] ?? ERR.num());
  }
  return aggregateValues(code, numbers(args.slice(2)));
});
define('INFO', (args) => {
  const key = strArg(args, 0).toLowerCase();
  if (key === 'system') return 'OpenERP';
  if (key === 'release') return '1.0';
  if (key === 'numfile') return 1;
  return ERR.value();
});
define('LEFTB', (args) => { const value = strArg(args, 0); const count = Math.max(0, Math.floor(numArg(args, 1, 1) as number)); return value.slice(0, count); });
define('RIGHTB', (args) => { const value = strArg(args, 0); const count = Math.max(0, Math.floor(numArg(args, 1, 1) as number)); return count ? value.slice(-count) : ''; });
define('MIDB', (args) => { const value = strArg(args, 0); const start = Math.max(1, Math.floor(numArg(args, 1) as number)); const count = Math.max(0, Math.floor(numArg(args, 2) as number)); return value.slice(start - 1, start - 1 + count); });
define('LENB', (args) => strArg(args, 0).length);
define('FINDB', (args) => { const find = strArg(args, 0); const within = strArg(args, 1); const at = Math.max(1, Math.floor(numArg(args, 2, 1) as number)); const index = within.indexOf(find, at - 1); return index < 0 ? ERR.value() : index + 1; });
define('SEARCHB', (args) => { const find = strArg(args, 0).toLowerCase(); const within = strArg(args, 1).toLowerCase(); const at = Math.max(1, Math.floor(numArg(args, 2, 1) as number)); const index = within.indexOf(find, at - 1); return index < 0 ? ERR.value() : index + 1; });
define('REPLACEB', (args) => { const value = strArg(args, 0); const start = Math.max(1, Math.floor(numArg(args, 1) as number)); const count = Math.max(0, Math.floor(numArg(args, 2) as number)); return value.slice(0, start - 1) + strArg(args, 3) + value.slice(start - 1 + count); });
define('ASC', (args) => text(one(args, 0)));
define('JIS', (args) => text(one(args, 0)));
define('PHONETIC', (args) => text(one(args, 0)));
define('ENCODEURL', (args) => encodeURIComponent(strArg(args, 0)));
define('HYPERLINK', (args) => { const label = one(args, 1); return label === null ? strArg(args, 0) : text(label); });
define('ADDRESS', (args) => {
  const row = Math.floor(numArg(args, 0) as number);
  const col = Math.floor(numArg(args, 1) as number);
  const abs = Math.floor(numArg(args, 2, 1) as number);
  const a1 = numArg(args, 3, 1) as number;
  const sheet = one(args, 4) === null ? '' : `${strArg(args, 4)}!`;
  const letters = columnName(col);
  if (a1 === 0) {
    const r = abs === 1 || abs === 3 ? `R${row}` : `R[${row}]`;
    const c = abs === 1 || abs === 2 ? `C${col}` : `C[${col}]`;
    return `${sheet}${r}${c}`;
  }
  const colText = abs === 1 || abs === 3 ? `$${letters}` : letters;
  const rowText = abs === 1 || abs === 2 ? `$${row}` : String(row);
  return `${sheet}${colText}${rowText}`;
});
define('COLUMN', (args) => { if (one(args, 0) === null) return 1; const match = /([A-Z]+)\d+/i.exec(strArg(args, 0)); if (!match) return ERR.value(); return columnNameToNumber(match[1]); });
define('COLUMNS', (args) => { const match = /([A-Z]+)\d+:([A-Z]+)\d+/i.exec(strArg(args, 0)); if (!match) return 1; return Math.abs(columnNameToNumber(match[2]) - columnNameToNumber(match[1])) + 1; });
define('ROW', (args) => { if (one(args, 0) === null) return 1; const match = /[A-Z]+(\d+)/i.exec(strArg(args, 0)); return match ? Number(match[1]) : ERR.value(); });
define('ROWS', (args) => { const match = /[A-Z]+(\d+):[A-Z]+(\d+)/i.exec(strArg(args, 0)); if (!match) return 1; return Math.abs(Number(match[2]) - Number(match[1])) + 1; });
define('WORKDAY.INTL', (args) => {
  let current = dateArg(one(args, 0)); if (isFormulaError(current)) return current;
  const days = Math.trunc(numArg(args, 1) as number);
  const weekend = one(args, 2) === null ? [0, 6] : weekendDays(one(args, 2));
  const holidays = new Set<number>();
  flatten([args[3] ?? null]).forEach((value) => { if (typeof value === 'number') holidays.add(value); });
  let remaining = Math.abs(days);
  const step = days < 0 ? -1 : 1;
  while (remaining > 0) {
    current = new Date(current.getTime() + step * 86400000);
    if (!weekend.includes(current.getUTCDay()) && !holidays.has(Math.floor(toSerial(current)))) remaining--;
  }
  return toSerial(current);
});
define('NETWORKDAYS.INTL', (args) => {
  const start = dateArg(one(args, 0)); const end = dateArg(one(args, 1));
  if (isFormulaError(start)) return start; if (isFormulaError(end)) return end;
  const weekend = one(args, 2) === null ? [0, 6] : weekendDays(one(args, 2));
  const holidays = new Set<number>();
  flatten([args[3] ?? null]).forEach((value) => { if (typeof value === 'number') holidays.add(value); });
  let count = 0; const direction = start <= end ? 1 : -1; const cursor = new Date(start.getTime());
  while ((direction > 0 && cursor <= end) || (direction < 0 && cursor >= end)) {
    if (!weekend.includes(cursor.getUTCDay()) && !holidays.has(Math.floor(toSerial(cursor)))) count += direction;
    cursor.setUTCDate(cursor.getUTCDate() + direction);
  }
  return count;
});

/* -------------------- extended catalogue v3 (statistics) ---------------- */
const aValues = (args: EvalValue[]): number[] => {
  const values: number[] = [];
  for (const value of flatten(args)) {
    if (typeof value === 'number') values.push(value);
    else if (typeof value === 'boolean') values.push(value ? 1 : 0);
    else if (typeof value === 'string' && value.trim() !== '') values.push(0);
  }
  return values;
};
const varianceOf = (values: number[], sample: boolean): number | FormulaError => {
  if (values.length < (sample ? 2 : 1)) return ERR.div0();
  const mean = values.reduce((s, x) => s + x, 0) / values.length;
  const total = values.reduce((s, x) => s + (x - mean) ** 2, 0);
  return total / (sample ? values.length - 1 : values.length);
};
const covarianceOf = (left: number[], right: number[], sample: boolean): number | FormulaError => {
  if (left.length !== right.length || left.length < (sample ? 2 : 1)) return ERR.na();
  const meanLeft = left.reduce((s, x) => s + x, 0) / left.length;
  const meanRight = right.reduce((s, x) => s + x, 0) / right.length;
  const total = left.reduce((s, x, i) => s + (x - meanLeft) * (right[i] - meanRight), 0);
  return total / (sample ? left.length - 1 : left.length);
};
const tCdf = (value: number, df: number): number => {
  if (df <= 0) return Number.NaN;
  const tail = 0.5 * betaI(df / 2, 0.5, df / (df + value * value));
  return value >= 0 ? 1 - tail : tail;
};
const fCdf = (value: number, d1: number, d2: number): number => {
  if (value <= 0) return 0;
  return betaI(d1 / 2, d2 / 2, (d1 * value) / (d1 * value + d2));
};
const chisqCdf = (value: number, df: number): number => value <= 0 ? 0 : gammaP(df / 2, value / 2);
const binomProbability = (x: number, n: number, p: number): number => {
  if (x < 0 || x > n) return 0;
  return Math.exp(lnGamma(n + 1) - lnGamma(x + 1) - lnGamma(n - x + 1) + x * Math.log(p) + (n - x) * Math.log(1 - p));
};
const binomCdf = (x: number, n: number, p: number): number => {
  let total = 0;
  for (let k = 0; k <= Math.floor(x); k++) total += binomProbability(k, n, p);
  return total;
};

define('AVERAGEA', (args) => { const v = aValues(args); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : ERR.div0(); });
define('MAXA', (args) => { const v = aValues(args); return v.length ? Math.max(...v) : 0; });
define('MINA', (args) => { const v = aValues(args); return v.length ? Math.min(...v) : 0; });
define('STDEVA', (args) => { const result = varianceOf(aValues(args), true); return isFormulaError(result) ? result : Math.sqrt(result); });
define('STDEVPA', (args) => { const result = varianceOf(aValues(args), false); return isFormulaError(result) ? result : Math.sqrt(result); });
define('VARA', (args) => varianceOf(aValues(args), true));
define('VARPA', (args) => varianceOf(aValues(args), false));
define('COVARIANCE.P', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); return isFormulaError(p) ? p : covarianceOf(p.a, p.b, false); });
define('COVARIANCE.S', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); return isFormulaError(p) ? p : covarianceOf(p.a, p.b, true); });
define('COVAR', (args) => { const p = pairValues(args[0] ?? null, args[1] ?? null); return isFormulaError(p) ? p : covarianceOf(p.a, p.b, false); });
define('STEYX', (args) => {
  const p = pairValues(args[0] ?? null, args[1] ?? null); if (isFormulaError(p)) return p;
  if (p.a.length < 3) return ERR.div0();
  const mx = p.a.reduce((s, x) => s + x, 0) / p.a.length;
  const my = p.b.reduce((s, x) => s + x, 0) / p.b.length;
  let num = 0; let den = 0;
  for (let i = 0; i < p.a.length; i++) { num += (p.a[i] - mx) * (p.b[i] - my); den += (p.a[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  const intercept = my - slope * mx;
  const sse = p.a.reduce((s, x, i) => s + (p.b[i] - (slope * x + intercept)) ** 2, 0);
  return Math.sqrt(sse / (p.a.length - 2));
});
define('FISHER', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : Math.abs(v) >= 1 ? ERR.num() : 0.5 * Math.log((1 + v) / (1 - v)); });
define('FISHERINV', (args) => { const v = numArg(args, 0); return isFormulaError(v) ? v : Math.tanh(v); });
define('STANDARDIZE', (args) => { const x = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); if (isFormulaError(x)) return x; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd; return sd <= 0 ? ERR.num() : (x - mean) / sd; });
define('PROB', (args) => {
  const xs = numbers([args[0] ?? null]); const ps = numbers([args[1] ?? null]);
  if (isFormulaError(xs)) return xs; if (isFormulaError(ps)) return ps;
  if (xs.length !== ps.length) return ERR.na();
  const lower = numArg(args, 2) as number;
  const upper = one(args, 3) === null ? lower : numArg(args, 3) as number;
  let total = 0;
  for (let i = 0; i < xs.length; i++) if (xs[i] >= lower && xs[i] <= upper) total += ps[i];
  return total;
});
const percentRankOf = (values: number[], x: number): number | FormulaError => {
  if (!values.length) return ERR.num();
  const sorted = [...values].sort((a, b) => a - b);
  if (x < sorted[0] || x > sorted[sorted.length - 1]) return ERR.na();
  if (sorted.length === 1) return x === sorted[0] ? 1 : ERR.na();
  const exact = sorted.indexOf(x);
  if (exact >= 0) return exact / (sorted.length - 1);
  let upper = sorted.findIndex((value) => value > x);
  if (upper < 0) upper = sorted.length - 1;
  const lower = upper - 1;
  return (lower + (x - sorted[lower]) / (sorted[upper] - sorted[lower])) / (sorted.length - 1);
};
define('PERCENTRANK', (args) => { const v = numbers([args[0] ?? null]); if (isFormulaError(v)) return v; const result = percentRankOf(v, numArg(args, 1) as number); return isFormulaError(result) ? result : Number(result.toFixed(3)); });
define('PERCENTRANK.INC', (args) => { const v = numbers([args[0] ?? null]); if (isFormulaError(v)) return v; const result = percentRankOf(v, numArg(args, 1) as number); return isFormulaError(result) ? result : Number(result.toFixed(3)); });
define('PERCENTRANK.EXC', (args) => { const v = numbers([args[0] ?? null]); if (isFormulaError(v)) return v; const result = percentRankOf(v, numArg(args, 1) as number); return isFormulaError(result) ? result : Number(((result * (v.length - 1) + 1) / (v.length + 1)).toFixed(3)); });
define('SKEW.P', (args) => { const v = numbers(args); if (isFormulaError(v)) return v; if (v.length < 3) return ERR.div0(); const mean = v.reduce((s, x) => s + x, 0) / v.length; const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length); return v.reduce((s, x) => s + ((x - mean) / sd) ** 3, 0) / v.length; });
define('NORM.DIST', (args) => {
  const x = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); const cumulative = Boolean(one(args, 3));
  if (isFormulaError(x)) return x; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd;
  if (sd <= 0) return ERR.num();
  return cumulative ? normCdf((x - mean) / sd) : normPdf((x - mean) / sd) / sd;
});
define('NORMDIST', (args) => {
  const x = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); const cumulative = Boolean(one(args, 3));
  if (isFormulaError(x)) return x; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd;
  if (sd <= 0) return ERR.num();
  return cumulative ? normCdf((x - mean) / sd) : normPdf((x - mean) / sd) / sd;
});
define('NORM.INV', (args) => { const p = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd; return p <= 0 || p >= 1 || sd <= 0 ? ERR.num() : mean + sd * normInv(p); });
define('NORMINV', (args) => { const p = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd; return p <= 0 || p >= 1 || sd <= 0 ? ERR.num() : mean + sd * normInv(p); });
define('NORM.S.DIST', (args) => { const z = numArg(args, 0); if (isFormulaError(z)) return z; return Boolean(one(args, 1)) ? normCdf(z) : normPdf(z); });
define('NORMSDIST', (args) => { const z = numArg(args, 0); return isFormulaError(z) ? z : normCdf(z); });
define('NORM.S.INV', (args) => { const p = numArg(args, 0); return isFormulaError(p) ? p : p <= 0 || p >= 1 ? ERR.num() : normInv(p); });
define('NORMSINV', (args) => { const p = numArg(args, 0); return isFormulaError(p) ? p : p <= 0 || p >= 1 ? ERR.num() : normInv(p); });
define('LOGNORM.DIST', (args) => {
  const x = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); const cumulative = Boolean(one(args, 3));
  if (isFormulaError(x)) return x; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd;
  if (x <= 0 || sd <= 0) return ERR.num();
  const z = (Math.log(x) - mean) / sd;
  return cumulative ? normCdf(z) : normPdf(z) / (x * sd);
});
define('LOGNORMDIST', (args) => {
  const x = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2);
  if (isFormulaError(x)) return x; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd;
  if (x <= 0 || sd <= 0) return ERR.num();
  return normCdf((Math.log(x) - mean) / sd);
});
define('LOGNORM.INV', (args) => { const p = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd; return p <= 0 || p >= 1 || sd <= 0 ? ERR.num() : Math.exp(mean + sd * normInv(p)); });
define('LOGINV', (args) => { const p = numArg(args, 0); const mean = numArg(args, 1); const sd = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(mean)) return mean; if (isFormulaError(sd)) return sd; return p <= 0 || p >= 1 || sd <= 0 ? ERR.num() : Math.exp(mean + sd * normInv(p)); });
define('EXPON.DIST', (args) => { const x = numArg(args, 0); const lambda = numArg(args, 1); const cumulative = Boolean(one(args, 2)); if (isFormulaError(x)) return x; if (isFormulaError(lambda)) return lambda; if (x < 0 || lambda <= 0) return ERR.num(); return cumulative ? 1 - Math.exp(-lambda * x) : lambda * Math.exp(-lambda * x); });
define('EXPONDIST', (args) => { const x = numArg(args, 0); const lambda = numArg(args, 1); const cumulative = Boolean(one(args, 2)); if (isFormulaError(x)) return x; if (isFormulaError(lambda)) return lambda; if (x < 0 || lambda <= 0) return ERR.num(); return cumulative ? 1 - Math.exp(-lambda * x) : lambda * Math.exp(-lambda * x); });
define('POISSON.DIST', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const mean = numArg(args, 1) as number; const cumulative = Boolean(one(args, 2));
  if (x < 0 || mean < 0) return ERR.num();
  if (!cumulative) return Math.exp(-mean + x * Math.log(mean) - lnGamma(x + 1));
  let total = 0;
  for (let k = 0; k <= x; k++) total += Math.exp(-mean + k * Math.log(mean) - lnGamma(k + 1));
  return total;
});
define('POISSON', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const mean = numArg(args, 1) as number; const cumulative = Boolean(one(args, 2));
  if (x < 0 || mean < 0) return ERR.num();
  if (!cumulative) return Math.exp(-mean + x * Math.log(mean) - lnGamma(x + 1));
  let total = 0;
  for (let k = 0; k <= x; k++) total += Math.exp(-mean + k * Math.log(mean) - lnGamma(k + 1));
  return total;
});
define('BINOM.DIST', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const n = Math.floor(numArg(args, 1) as number); const p = numArg(args, 2) as number; const cumulative = Boolean(one(args, 3));
  if (x < 0 || x > n || p < 0 || p > 1) return ERR.num();
  return cumulative ? binomCdf(x, n, p) : binomProbability(x, n, p);
});
define('BINOMDIST', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const n = Math.floor(numArg(args, 1) as number); const p = numArg(args, 2) as number; const cumulative = Boolean(one(args, 3));
  if (x < 0 || x > n || p < 0 || p > 1) return ERR.num();
  return cumulative ? binomCdf(x, n, p) : binomProbability(x, n, p);
});
define('BINOM.INV', (args) => {
  const n = Math.floor(numArg(args, 0) as number); const p = numArg(args, 1) as number; const alpha = numArg(args, 2) as number;
  for (let x = 0; x <= n; x++) if (binomCdf(x, n, p) >= alpha) return x;
  return n;
});
define('NEGBINOM.DIST', (args) => {
  const failures = Math.floor(numArg(args, 0) as number); const successes = Math.floor(numArg(args, 1) as number); const p = numArg(args, 2) as number; const cumulative = Boolean(one(args, 3));
  if (failures < 0 || successes < 1 || p <= 0 || p > 1) return ERR.num();
  const term = (f: number) => Math.exp(lnGamma(f + successes) - lnGamma(f + 1) - lnGamma(successes) + successes * Math.log(p) + f * Math.log(1 - p));
  if (!cumulative) return term(failures);
  let total = 0;
  for (let f = 0; f <= failures; f++) total += term(f);
  return total;
});
define('NEGBINOMDIST', (args) => {
  const failures = Math.floor(numArg(args, 0) as number); const successes = Math.floor(numArg(args, 1) as number); const p = numArg(args, 2) as number;
  if (failures < 0 || successes < 1 || p <= 0 || p > 1) return ERR.num();
  return Math.exp(lnGamma(failures + successes) - lnGamma(failures + 1) - lnGamma(successes) + successes * Math.log(p) + failures * Math.log(1 - p));
});
define('HYPGEOM.DIST', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const n = Math.floor(numArg(args, 1) as number); const k = Math.floor(numArg(args, 2) as number); const total = Math.floor(numArg(args, 3) as number); const cumulative = Boolean(one(args, 4));
  const choose = (a: number, b: number) => Math.exp(lnGamma(a + 1) - lnGamma(b + 1) - lnGamma(a - b + 1));
  const term = (v: number) => choose(k, v) * choose(total - k, n - v) / choose(total, n);
  if (!cumulative) return term(x);
  let sum = 0;
  for (let v = Math.max(0, n - (total - k)); v <= Math.min(x, k); v++) sum += term(v);
  return sum;
});
define('HYPGEOMDIST', (args) => {
  const x = Math.floor(numArg(args, 0) as number); const n = Math.floor(numArg(args, 1) as number); const k = Math.floor(numArg(args, 2) as number); const total = Math.floor(numArg(args, 3) as number);
  const choose = (a: number, b: number) => Math.exp(lnGamma(a + 1) - lnGamma(b + 1) - lnGamma(a - b + 1));
  return choose(k, x) * choose(total - k, n - x) / choose(total, n);
});
define('BETA.DIST', (args) => {
  const x = numArg(args, 0); const a = numArg(args, 1); const b = numArg(args, 2); const cumulative = Boolean(one(args, 3));
  if (isFormulaError(x)) return x; if (isFormulaError(a)) return a; if (isFormulaError(b)) return b;
  if (x < 0 || x > 1 || a <= 0 || b <= 0) return ERR.num();
  if (cumulative) return betaI(a, b, x);
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)
    + lnGamma(a + b) - lnGamma(a) - lnGamma(b));
});
define('BETADIST', (args) => {
  const x = numArg(args, 0); const a = numArg(args, 1); const b = numArg(args, 2);
  if (isFormulaError(x)) return x; if (isFormulaError(a)) return a; if (isFormulaError(b)) return b;
  const lower = one(args, 3) === null ? 0 : numArg(args, 3) as number;
  const upper = one(args, 4) === null ? 1 : numArg(args, 4) as number;
  const scaled = (x - lower) / (upper - lower);
  return scaled < 0 || scaled > 1 || a <= 0 || b <= 0 ? ERR.num() : betaI(a, b, scaled);
});
define('BETA.INV', (args) => {
  const p = numArg(args, 0); const a = numArg(args, 1); const b = numArg(args, 2);
  if (isFormulaError(p)) return p; if (isFormulaError(a)) return a; if (isFormulaError(b)) return b;
  return p <= 0 || p >= 1 || a <= 0 || b <= 0 ? ERR.num() : bisect((value) => betaI(a, b, value), p, 0, 1);
});
define('BETAINV', (args) => {
  const p = numArg(args, 0); const a = numArg(args, 1); const b = numArg(args, 2);
  if (isFormulaError(p)) return p; if (isFormulaError(a)) return a; if (isFormulaError(b)) return b;
  const lower = one(args, 3) === null ? 0 : numArg(args, 3) as number;
  const upper = one(args, 4) === null ? 1 : numArg(args, 4) as number;
  return p <= 0 || p >= 1 || a <= 0 || b <= 0 ? ERR.num() : lower + (upper - lower) * bisect((value) => betaI(a, b, value), p, 0, 1);
});
define('T.DIST', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); const cumulative = Boolean(one(args, 2)); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; if (df <= 0) return ERR.num(); if (cumulative) return tCdf(x, df); const factor = Math.exp(lnGamma((df + 1) / 2) - lnGamma(df / 2)); return factor / Math.sqrt(df * Math.PI) * Math.pow(1 + x * x / df, -(df + 1) / 2); });
define('T.DIST.RT', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; return df <= 0 ? ERR.num() : 1 - tCdf(x, df); });
define('T.DIST.2T', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; return df <= 0 ? ERR.num() : 2 * (1 - tCdf(Math.abs(x), df)); });
define('TDIST', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); const tails = Math.floor(numArg(args, 2) as number); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; if (df <= 0 || tails < 1 || tails > 2) return ERR.num(); return tails === 1 ? 1 - tCdf(x, df) : 2 * (1 - tCdf(Math.abs(x), df)); });
define('T.INV', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => tCdf(value, df), p, -100, 100); });
define('TINV', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => tCdf(value, df), 1 - p / 2, -100, 100); });
define('T.INV.2T', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => tCdf(value, df), 1 - p / 2, -100, 100); });
define('CHISQ.DIST', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); const cumulative = Boolean(one(args, 2)); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; if (x < 0 || df <= 0) return ERR.num(); if (cumulative) return chisqCdf(x, df); return Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - lnGamma(df / 2) - (df / 2) * Math.log(2)); });
define('CHISQ.DIST.RT', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; return x < 0 || df <= 0 ? ERR.num() : 1 - chisqCdf(x, df); });
define('CHIDIST', (args) => { const x = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(x)) return x; if (isFormulaError(df)) return df; return x < 0 || df <= 0 ? ERR.num() : 1 - chisqCdf(x, df); });
define('CHISQ.INV', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => chisqCdf(value, df), p, 0, 10000); });
define('CHIINV', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => chisqCdf(value, df), 1 - p, 0, 10000); });
define('CHISQ.INV.RT', (args) => { const p = numArg(args, 0); const df = numArg(args, 1); if (isFormulaError(p)) return p; if (isFormulaError(df)) return df; return p <= 0 || p >= 1 || df <= 0 ? ERR.num() : bisect((value) => chisqCdf(value, df), 1 - p, 0, 10000); });
define('F.DIST', (args) => { const x = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); const cumulative = Boolean(one(args, 3)); if (isFormulaError(x)) return x; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; if (x < 0 || d1 <= 0 || d2 <= 0) return ERR.num(); if (cumulative) return fCdf(x, d1, d2); const factor = Math.exp(lnGamma((d1 + d2) / 2) - lnGamma(d1 / 2) - lnGamma(d2 / 2)); return factor * Math.pow(d1 / d2, d1 / 2) * Math.pow(x, d1 / 2 - 1) * Math.pow(1 + (d1 * x) / d2, -(d1 + d2) / 2); });
define('F.DIST.RT', (args) => { const x = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); if (isFormulaError(x)) return x; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; return x < 0 || d1 <= 0 || d2 <= 0 ? ERR.num() : 1 - fCdf(x, d1, d2); });
define('FDIST', (args) => { const x = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); if (isFormulaError(x)) return x; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; return x < 0 || d1 <= 0 || d2 <= 0 ? ERR.num() : 1 - fCdf(x, d1, d2); });
define('F.INV', (args) => { const p = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; return p <= 0 || p >= 1 || d1 <= 0 || d2 <= 0 ? ERR.num() : bisect((value) => fCdf(value, d1, d2), p, 0, 10000); });
define('FINV', (args) => { const p = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; return p <= 0 || p >= 1 || d1 <= 0 || d2 <= 0 ? ERR.num() : bisect((value) => fCdf(value, d1, d2), 1 - p, 0, 10000); });
define('F.INV.RT', (args) => { const p = numArg(args, 0); const d1 = numArg(args, 1); const d2 = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(d1)) return d1; if (isFormulaError(d2)) return d2; return p <= 0 || p >= 1 || d1 <= 0 || d2 <= 0 ? ERR.num() : bisect((value) => fCdf(value, d1, d2), 1 - p, 0, 10000); });
define('GAMMA.DIST', (args) => { const x = numArg(args, 0); const alpha = numArg(args, 1); const beta = numArg(args, 2); const cumulative = Boolean(one(args, 3)); if (isFormulaError(x)) return x; if (isFormulaError(alpha)) return alpha; if (isFormulaError(beta)) return beta; if (x < 0 || alpha <= 0 || beta <= 0) return ERR.num(); if (cumulative) return gammaP(alpha, x / beta); return Math.exp((alpha - 1) * Math.log(x) - x / beta - lnGamma(alpha) - alpha * Math.log(beta)); });
define('GAMMADIST', (args) => { const x = numArg(args, 0); const alpha = numArg(args, 1); const beta = numArg(args, 2); const cumulative = Boolean(one(args, 3)); if (isFormulaError(x)) return x; if (isFormulaError(alpha)) return alpha; if (isFormulaError(beta)) return beta; if (x < 0 || alpha <= 0 || beta <= 0) return ERR.num(); if (cumulative) return gammaP(alpha, x / beta); return Math.exp((alpha - 1) * Math.log(x) - x / beta - lnGamma(alpha) - alpha * Math.log(beta)); });
define('GAMMA.INV', (args) => { const p = numArg(args, 0); const alpha = numArg(args, 1); const beta = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(alpha)) return alpha; if (isFormulaError(beta)) return beta; return p <= 0 || p >= 1 || alpha <= 0 || beta <= 0 ? ERR.num() : bisect((value) => gammaP(alpha, value / beta), p, 0, 100000); });
define('GAMMAINV', (args) => { const p = numArg(args, 0); const alpha = numArg(args, 1); const beta = numArg(args, 2); if (isFormulaError(p)) return p; if (isFormulaError(alpha)) return alpha; if (isFormulaError(beta)) return beta; return p <= 0 || p >= 1 || alpha <= 0 || beta <= 0 ? ERR.num() : bisect((value) => gammaP(alpha, value / beta), p, 0, 100000); });
define('WEIBULL', (args) => { const x = numArg(args, 0); const alpha = numArg(args, 1); const beta = numArg(args, 2); const cumulative = Boolean(one(args, 3)); if (isFormulaError(x)) return x; if (isFormulaError(alpha)) return alpha; if (isFormulaError(beta)) return beta; if (x < 0 || alpha <= 0 || beta <= 0) return ERR.num(); return cumulative ? 1 - Math.exp(-Math.pow(x / beta, alpha)) : alpha / Math.pow(beta, alpha) * Math.pow(x, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha)); });
define('CONFIDENCE.NORM', (args) => { const alpha = numArg(args, 0); const sd = numArg(args, 1); const n = numArg(args, 2); if (isFormulaError(alpha)) return alpha; if (isFormulaError(sd)) return sd; if (isFormulaError(n)) return n; return alpha <= 0 || alpha >= 1 || sd <= 0 || n < 1 ? ERR.num() : normInv(1 - alpha / 2) * sd / Math.sqrt(n); });
define('CONFIDENCE', (args) => { const alpha = numArg(args, 0); const sd = numArg(args, 1); const n = numArg(args, 2); if (isFormulaError(alpha)) return alpha; if (isFormulaError(sd)) return sd; if (isFormulaError(n)) return n; return alpha <= 0 || alpha >= 1 || sd <= 0 || n < 1 ? ERR.num() : normInv(1 - alpha / 2) * sd / Math.sqrt(n); });
define('CONFIDENCE.T', (args) => { const alpha = numArg(args, 0); const sd = numArg(args, 1); const n = numArg(args, 2); if (isFormulaError(alpha)) return alpha; if (isFormulaError(sd)) return sd; if (isFormulaError(n)) return n; if (alpha <= 0 || alpha >= 1 || sd <= 0 || n < 2) return ERR.num(); const t = bisect((value) => tCdf(value, n - 1), 1 - alpha / 2, -100, 100); return t * sd / Math.sqrt(n); });
define('Z.TEST', (args) => {
  const values = numbers([args[0] ?? null]); if (isFormulaError(values)) return values;
  const x = numArg(args, 1) as number; const sd = one(args, 2) === null ? Math.sqrt(varianceOf(values, true) as number) : numArg(args, 2) as number;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return 1 - normCdf((mean - x) / (sd / Math.sqrt(values.length)));
});
define('T.TEST', (args) => {
  const left = numbers([args[0] ?? null]); const right = numbers([args[1] ?? null]);
  if (isFormulaError(left)) return left; if (isFormulaError(right)) return right;
  const tails = Math.floor(numArg(args, 2) as number); const type = Math.floor(numArg(args, 3) as number);
  let t = 0; let df = 0;
  if (type === 1) {
    if (left.length !== right.length || left.length < 2) return ERR.na();
    const diff = left.map((value, i) => value - right[i]);
    const mean = diff.reduce((s, v) => s + v, 0) / diff.length;
    const variance = varianceOf(diff, true) as number;
    t = mean / Math.sqrt(variance / diff.length); df = diff.length - 1;
  } else {
    if (left.length < 2 || right.length < 2) return ERR.na();
    const meanLeft = left.reduce((s, v) => s + v, 0) / left.length;
    const meanRight = right.reduce((s, v) => s + v, 0) / right.length;
    const varLeft = varianceOf(left, true) as number;
    const varRight = varianceOf(right, true) as number;
    if (type === 2) {
      const pooled = ((left.length - 1) * varLeft + (right.length - 1) * varRight) / (left.length + right.length - 2);
      t = (meanLeft - meanRight) / Math.sqrt(pooled * (1 / left.length + 1 / right.length));
      df = left.length + right.length - 2;
    } else {
      t = (meanLeft - meanRight) / Math.sqrt(varLeft / left.length + varRight / right.length);
      df = Math.pow(varLeft / left.length + varRight / right.length, 2)
        / (Math.pow(varLeft / left.length, 2) / (left.length - 1) + Math.pow(varRight / right.length, 2) / (right.length - 1));
    }
  }
  const p = 1 - tCdf(Math.abs(t), df);
  return tails === 1 ? p : 2 * p;
});
define('TTEST', (args) => {
  const left = numbers([args[0] ?? null]); const right = numbers([args[1] ?? null]);
  if (isFormulaError(left)) return left; if (isFormulaError(right)) return right;
  const tails = Math.floor(numArg(args, 2) as number); const type = Math.floor(numArg(args, 3) as number);
  const meanLeft = left.reduce((s, v) => s + v, 0) / left.length;
  const meanRight = right.reduce((s, v) => s + v, 0) / right.length;
  const varLeft = varianceOf(left, true) as number;
  const varRight = varianceOf(right, true) as number;
  let t = 0; let df = 0;
  if (type === 1) { const diff = left.map((value, i) => value - right[i]); const mean = diff.reduce((s, v) => s + v, 0) / diff.length; t = mean / Math.sqrt((varianceOf(diff, true) as number) / diff.length); df = diff.length - 1; }
  else if (type === 2) { const pooled = ((left.length - 1) * varLeft + (right.length - 1) * varRight) / (left.length + right.length - 2); t = (meanLeft - meanRight) / Math.sqrt(pooled * (1 / left.length + 1 / right.length)); df = left.length + right.length - 2; }
  else { t = (meanLeft - meanRight) / Math.sqrt(varLeft / left.length + varRight / right.length); df = Math.pow(varLeft / left.length + varRight / right.length, 2) / (Math.pow(varLeft / left.length, 2) / (left.length - 1) + Math.pow(varRight / right.length, 2) / (right.length - 1)); }
  const p = 1 - tCdf(Math.abs(t), df);
  return tails === 1 ? p : 2 * p;
});
define('F.TEST', (args) => {
  const left = numbers([args[0] ?? null]); const right = numbers([args[1] ?? null]);
  if (isFormulaError(left)) return left; if (isFormulaError(right)) return right;
  const f = (varianceOf(left, true) as number) / (varianceOf(right, true) as number);
  const p = fCdf(f, left.length - 1, right.length - 1);
  return 2 * Math.min(p, 1 - p);
});
define('FTEST', (args) => {
  const left = numbers([args[0] ?? null]); const right = numbers([args[1] ?? null]);
  if (isFormulaError(left)) return left; if (isFormulaError(right)) return right;
  const f = (varianceOf(left, true) as number) / (varianceOf(right, true) as number);
  const p = fCdf(f, left.length - 1, right.length - 1);
  return 2 * Math.min(p, 1 - p);
});
define('CHISQ.TEST', (args) => {
  const actual = matrix(args[0] ?? null); const expected = matrix(args[1] ?? null);
  if (isFormulaError(actual)) return actual; if (isFormulaError(expected)) return expected;
  let chi = 0;
  for (let r = 0; r < actual.length; r++) for (let c = 0; c < actual[r].length; c++) {
    const expectedValue = Number(expected[r]?.[c] ?? 0);
    if (!expectedValue) return ERR.div0();
    chi += ((Number(actual[r][c] ?? 0) - expectedValue) ** 2) / expectedValue;
  }
  const df = Math.max(1, (actual.length - 1) * ((actual[0]?.length ?? 1) - 1));
  return 1 - chisqCdf(chi, df);
});

/* ---------------- extended catalogue v4 (financial/engineering) -------- */
const paymentFor = (rate: number, nper: number, pv: number, fv = 0, type = 0): number => {
  if (rate === 0) return -(pv + fv) / nper;
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + fv) * rate / ((factor - 1) * (1 + rate * type));
};
const balanceAt = (rate: number, nper: number, pv: number, per: number, fv = 0, type = 0): number => {
  const payment = paymentFor(rate, nper, pv, fv, type);
  if (rate === 0) return pv + payment * (per - 1);
  return pv * Math.pow(1 + rate, per - 1)
    + payment * (1 + rate * type) * (Math.pow(1 + rate, per - 1) - 1) / rate;
};
define('CUMIPMT', (args) => {
  const rate = numArg(args, 0) as number; const nper = numArg(args, 1) as number; const pv = numArg(args, 2) as number;
  const start = Math.floor(numArg(args, 3) as number); const end = Math.floor(numArg(args, 4) as number); const type = Math.floor(numArg(args, 5, 0) as number);
  if (rate <= 0 || nper <= 0 || pv <= 0 || start < 1 || end < start || end > nper) return ERR.num();
  let total = 0;
  for (let per = start; per <= end; per++) total += balanceAt(rate, nper, pv, per, 0, type) * rate;
  return -total;
});
define('CUMPRINC', (args) => {
  const rate = numArg(args, 0) as number; const nper = numArg(args, 1) as number; const pv = numArg(args, 2) as number;
  const start = Math.floor(numArg(args, 3) as number); const end = Math.floor(numArg(args, 4) as number); const type = Math.floor(numArg(args, 5, 0) as number);
  if (rate <= 0 || nper <= 0 || pv <= 0 || start < 1 || end < start || end > nper) return ERR.num();
  const payment = paymentFor(rate, nper, pv, 0, type);
  let total = 0;
  for (let per = start; per <= end; per++) total += payment - balanceAt(rate, nper, pv, per, 0, type) * rate;
  return total;
});
define('ISPMT', (args) => { const rate = numArg(args, 0) as number; const per = numArg(args, 1) as number; const nper = numArg(args, 2) as number; const pv = numArg(args, 3) as number; return pv * rate * (per / nper - 1); });
define('XNPV', (args) => {
  const rate = numArg(args, 0) as number;
  const values = numbers([args[1] ?? null]); const dates = numbers([args[2] ?? null]);
  if (isFormulaError(values)) return values; if (isFormulaError(dates)) return dates;
  if (values.length !== dates.length || !values.length || rate <= -1) return ERR.num();
  const base = dates[0];
  return values.reduce((sum, value, index) => sum + value / Math.pow(1 + rate, (dates[index] - base) / 365), 0);
});
define('MIRR', (args) => {
  const values = numbers([args[0] ?? null]); const finance = numArg(args, 1) as number; const reinvest = numArg(args, 2) as number;
  if (isFormulaError(values)) return values;
  const positives = values.filter((value) => value > 0); const negatives = values.filter((value) => value < 0);
  if (!positives.length || !negatives.length) return ERR.div0();
  const n = values.length;
  const fvPositive = positives.reduce((sum, value, index) => sum + value * Math.pow(1 + reinvest, n - 1 - index), 0);
  const pvNegative = negatives.reduce((sum, value, index) => sum + value / Math.pow(1 + finance, index), 0);
  return Math.pow(fvPositive / -pvNegative, 1 / (n - 1)) - 1;
});
define('VDB', (args) => {
  const cost = numArg(args, 0) as number; const salvage = numArg(args, 1) as number; const life = numArg(args, 2) as number;
  const start = numArg(args, 3) as number; const end = numArg(args, 4) as number; const factor = numArg(args, 5, 2) as number;
  if (cost < 0 || salvage < 0 || life <= 0 || start < 0 || end < start) return ERR.num();
  let value = cost; let total = 0;
  const last = Math.min(life, Math.ceil(end));
  for (let period = 1; period <= last; period++) {
    const depreciation = Math.min(value * factor / life, Math.max(0, value - salvage));
    const from = Math.max(start, period - 1); const to = Math.min(end, period);
    if (to > from) total += depreciation * (to - from);
    value -= depreciation;
  }
  return total;
});
define('DOLLARDE', (args) => { const dollar = numArg(args, 0) as number; const fraction = Math.floor(numArg(args, 1) as number); if (fraction <= 0) return ERR.div0(); const whole = Math.trunc(dollar); return whole + (dollar - whole) * Math.pow(10, Math.ceil(Math.log10(fraction))) / fraction; });
define('DOLLARFR', (args) => { const dollar = numArg(args, 0) as number; const fraction = Math.floor(numArg(args, 1) as number); if (fraction <= 0) return ERR.div0(); const whole = Math.trunc(dollar); return whole + (dollar - whole) * fraction / Math.pow(10, Math.ceil(Math.log10(fraction))); });
define('DISC', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const price = numArg(args, 2) as number; const redemption = numArg(args, 3) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return days <= 0 || price <= 0 || redemption <= 0 ? ERR.num() : (redemption - price) / redemption * 365 / days; });
define('INTRATE', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const investment = numArg(args, 2) as number; const redemption = numArg(args, 3) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return days <= 0 || investment <= 0 ? ERR.num() : (redemption - investment) / investment * 365 / days; });
define('RECEIVED', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const investment = numArg(args, 2) as number; const discount = numArg(args, 3) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; const denominator = 1 - discount * days / 365; return denominator <= 0 || investment <= 0 ? ERR.num() : investment / denominator; });
define('PRICEDISC', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const discount = numArg(args, 2) as number; const redemption = numArg(args, 3) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return redemption - discount * redemption * days / 365; });
define('YIELDDISC', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const price = numArg(args, 2) as number; const redemption = numArg(args, 3) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return days <= 0 || price <= 0 ? ERR.num() : (redemption - price) / price * 365 / days; });
define('TBILLPRICE', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const discount = numArg(args, 2) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return 100 * (1 - discount * days / 360); });
define('TBILLYIELD', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const price = numArg(args, 2) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return days <= 0 || price <= 0 ? ERR.num() : (100 - price) / price * 360 / days; });
define('TBILLEQ', (args) => { const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1)); const discount = numArg(args, 2) as number; if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity; const days = (maturity.getTime() - settlement.getTime()) / 86400000; return 365 * discount / (360 - discount * days); });
define('DURATION', (args) => {
  const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1));
  const coupon = numArg(args, 2) as number; const yieldRate = numArg(args, 3) as number;
  const frequency = Math.floor(numArg(args, 4, 2) as number);
  if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity;
  const years = (maturity.getTime() - settlement.getTime()) / (365.25 * 86400000);
  const periods = Math.max(1, Math.round(years * frequency));
  const payment = 100 * coupon / frequency;
  const rate = yieldRate / frequency;
  let price = 0; let weighted = 0;
  for (let period = 1; period <= periods; period++) {
    const cash = payment + (period === periods ? 100 : 0);
    const pv = cash / Math.pow(1 + rate, period);
    price += pv; weighted += pv * period;
  }
  return price ? weighted / price / frequency : ERR.num();
});
define('MDURATION', (args) => {
  const settlement = dateArg(one(args, 0)); const maturity = dateArg(one(args, 1));
  const coupon = numArg(args, 2) as number; const yieldRate = numArg(args, 3) as number;
  const frequency = Math.floor(numArg(args, 4, 2) as number);
  if (isFormulaError(settlement)) return settlement; if (isFormulaError(maturity)) return maturity;
  const years = (maturity.getTime() - settlement.getTime()) / (365.25 * 86400000);
  const periods = Math.max(1, Math.round(years * frequency));
  const payment = 100 * coupon / frequency;
  const rate = yieldRate / frequency;
  let price = 0; let weighted = 0;
  for (let period = 1; period <= periods; period++) {
    const cash = payment + (period === periods ? 100 : 0);
    const pv = cash / Math.pow(1 + rate, period);
    price += pv; weighted += pv * period;
  }
  return price ? (weighted / price / frequency) / (1 + rate) : ERR.num();
});

interface Cx { re: number; im: number; }
const parseCx = (value: EvalValue): Cx | FormulaError => {
  if (typeof value === 'number') return { re: value, im: 0 };
  const source = String(value ?? '').replace(/\s/g, '');
  if (!source) return ERR.num();
  const hasSuffix = /[ij]$/i.test(source);
  const core = hasSuffix ? source.slice(0, -1) : source;
  if (hasSuffix && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(core)) {
    return { re: 0, im: core === '' || core === '+' ? 1 : core === '-' ? -1 : Number(core) };
  }
  if (core === '' || core === '+') return { re: 0, im: 1 };
  if (core === '-') return { re: 0, im: -1 };
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+))([+-])(\d+\.?\d*|\.\d+)?$/.exec(core);
  if (match) {
    const magnitude = match[3] === undefined ? 1 : Number(match[3]);
    return { re: Number(match[1]), im: match[2] === '-' ? -magnitude : magnitude };
  }
  const realOnly = /^([+-]?(?:\d+\.?\d*|\.\d+))$/.exec(core);
  if (!realOnly) return ERR.num();
  return { re: Number(realOnly[1]), im: 0 };
};
const formatCx = (value: Cx): string => {
  const re = Math.abs(value.re) < 1e-12 ? 0 : Number(value.re.toFixed(12));
  const im = Math.abs(value.im) < 1e-12 ? 0 : Number(value.im.toFixed(12));
  if (im === 0) return String(re);
  if (re === 0) return `${im}i`;
  return `${re}${im >= 0 ? '+' : ''}${im}i`;
};
const cxArg = (args: EvalValue[], index: number): Cx | FormulaError => parseCx(one(args, index));
const cxOps = (args: EvalValue[], operation: (a: Cx, b: Cx) => Cx): FormulaValue => {
  let result = cxArg(args, 0);
  if (isFormulaError(result)) return result;
  for (let i = 1; i < args.length; i++) {
    const next = cxArg(args, i);
    if (isFormulaError(next)) return next;
    result = operation(result, next);
  }
  return formatCx(result);
};
const cxAdd = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
const cxSub = (a: Cx, b: Cx): Cx => ({ re: a.re - b.re, im: a.im - b.im });
const cxMul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cxDiv = (a: Cx, b: Cx): Cx => {
  const denominator = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / denominator, im: (a.im * b.re - a.re * b.im) / denominator };
};
const cxExp = (a: Cx): Cx => ({ re: Math.exp(a.re) * Math.cos(a.im), im: Math.exp(a.re) * Math.sin(a.im) });
const cxLn = (a: Cx): Cx => ({ re: Math.log(Math.hypot(a.re, a.im)), im: Math.atan2(a.im, a.re) });
const cxSin = (a: Cx): Cx => ({ re: Math.sin(a.re) * Math.cosh(a.im), im: Math.cos(a.re) * Math.sinh(a.im) });
const cxCos = (a: Cx): Cx => ({ re: Math.cos(a.re) * Math.cosh(a.im), im: -Math.sin(a.re) * Math.sinh(a.im) });
const cxSinh = (a: Cx): Cx => ({ re: Math.sinh(a.re) * Math.cos(a.im), im: Math.cosh(a.re) * Math.sin(a.im) });
const cxCosh = (a: Cx): Cx => ({ re: Math.cosh(a.re) * Math.cos(a.im), im: Math.sinh(a.re) * Math.sin(a.im) });
define('COMPLEX', (args) => {
  const re = numArg(args, 0) as number; const im = numArg(args, 1) as number; const suffix = one(args, 2) === null ? 'i' : strArg(args, 2);
  if (suffix !== 'i' && suffix !== 'j') return ERR.value();
  const base = formatCx({ re, im });
  return suffix === 'j' ? base.replace(/i$/, 'j') : base;
});
define('IMREAL', (args) => { const value = cxArg(args, 0); return isFormulaError(value) ? value : value.re; });
define('IMAGINARY', (args) => { const value = cxArg(args, 0); return isFormulaError(value) ? value : value.im; });
define('IMABS', (args) => { const value = cxArg(args, 0); return isFormulaError(value) ? value : Math.hypot(value.re, value.im); });
define('IMSUM', (args) => cxOps(args, cxAdd));
define('IMSUB', (args) => { const a = cxArg(args, 0); const b = cxArg(args, 1); if (isFormulaError(a)) return a; if (isFormulaError(b)) return b; return formatCx(cxSub(a, b)); });
define('IMPRODUCT', (args) => cxOps(args, cxMul));
define('IMDIV', (args) => { const a = cxArg(args, 0); const b = cxArg(args, 1); if (isFormulaError(a)) return a; if (isFormulaError(b)) return b; return b.re === 0 && b.im === 0 ? ERR.div0() : formatCx(cxDiv(a, b)); });
define('IMPOWER', (args) => { const a = cxArg(args, 0); const power = numArg(args, 1) as number; if (isFormulaError(a)) return a; if (a.re === 0 && a.im === 0) return power === 0 ? 1 : 0; const ln = cxLn(a); return formatCx(cxExp({ re: ln.re * power, im: ln.im * power })); });
define('IMEXP', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxExp(a)); });
define('IMLN', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxLn(a)); });
define('IMLOG10', (args) => { const a = cxArg(args, 0); if (isFormulaError(a)) return a; const ln = cxLn(a); return formatCx({ re: ln.re / Math.LN10, im: ln.im / Math.LN10 }); });
define('IMLOG2', (args) => { const a = cxArg(args, 0); if (isFormulaError(a)) return a; const ln = cxLn(a); return formatCx({ re: ln.re / Math.LN2, im: ln.im / Math.LN2 }); });
define('IMSQRT', (args) => { const a = cxArg(args, 0); if (isFormulaError(a)) return a; const root = Math.hypot(a.re, a.im); const angle = Math.atan2(a.im, a.re) / 2; const radius = Math.sqrt(root); return formatCx({ re: radius * Math.cos(angle), im: radius * Math.sin(angle) }); });
define('IMCONJUGATE', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx({ re: a.re, im: -a.im }); });
define('IMARGUMENT', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : Math.atan2(a.im, a.re); });
define('IMSIN', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxSin(a)); });
define('IMCOS', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxCos(a)); });
define('IMTAN', (args) => { const a = cxArg(args, 0); if (isFormulaError(a)) return a; return formatCx(cxDiv(cxSin(a), cxCos(a))); });
define('IMSINH', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxSinh(a)); });
define('IMCOSH', (args) => { const a = cxArg(args, 0); return isFormulaError(a) ? a : formatCx(cxCosh(a)); });
define('IMTANH', (args) => { const a = cxArg(args, 0); if (isFormulaError(a)) return a; return formatCx(cxDiv(cxSinh(a), cxCosh(a))); });
const CONVERT_FACTORS: Record<string, { unit: string; factor: number }> = {
  m: { unit: 'm', factor: 1 }, km: { unit: 'm', factor: 1000 }, cm: { unit: 'm', factor: 0.01 }, mm: { unit: 'm', factor: 0.001 },
  in: { unit: 'm', factor: 0.0254 }, ft: { unit: 'm', factor: 0.3048 }, yd: { unit: 'm', factor: 0.9144 }, mi: { unit: 'm', factor: 1609.344 },
  g: { unit: 'g', factor: 1 }, kg: { unit: 'g', factor: 1000 }, lbm: { unit: 'g', factor: 453.59237 }, ozm: { unit: 'g', factor: 28.349523125 },
  sec: { unit: 's', factor: 1 }, min: { unit: 's', factor: 60 }, hr: { unit: 's', factor: 3600 }, day: { unit: 's', factor: 86400 },
  l: { unit: 'l', factor: 1 }, gal: { unit: 'l', factor: 3.785411784 }, qt: { unit: 'l', factor: 0.946352946 },
  'm2': { unit: 'm2', factor: 1 }, 'ft2': { unit: 'm2', factor: 0.09290304 }, 'm3': { unit: 'm3', factor: 1 }, 'ft3': { unit: 'm3', factor: 0.028316846592 },
};
define('CONVERT', (args) => {
  const value = numArg(args, 0) as number; const from = strArg(args, 1).toLowerCase(); const to = strArg(args, 2).toLowerCase();
  if (from === 'c' && to === 'f') return value * 9 / 5 + 32;
  if (from === 'f' && to === 'c') return (value - 32) * 5 / 9;
  if (from === 'c' && to === 'k') return value + 273.15;
  if (from === 'k' && to === 'c') return value - 273.15;
  const source = CONVERT_FACTORS[from]; const target = CONVERT_FACTORS[to];
  return !source || !target || source.unit !== target.unit ? ERR.na() : value * source.factor / target.factor;
});

/* ------------------------------ public API ------------------------------- */

export function evaluateFormula(sheet: ExcelSheet, formula: string): string {
  if (!formula.startsWith('=')) return formula;
  const ctx = createContext(sheet);
  try {
    const ast = new Parser(tokenize(formula.slice(1))).parse();
    const value = evaluateNode(ast, ctx);
    if (isFormulaError(value)) return value.code;
    if (isRange(value)) return '#VALUE!';
    return text(value);
  } catch (error) {
    return isFormulaError(error) ? error.code : '#VALUE!';
  }
}

export function createContext(sheet: ExcelSheet): EvalContext {
  return {
    getCell(ref: string): FormulaValue {
      const cell = sheet.cells.get(ref);
      return cell ? cellValue(cell) : null;
    },
    getRange(start: string, end: string): RangeValue {
      const a = parseRef(start);
      const b = parseRef(end);
      if (!a || !b) return { kind: 'range', rows: [] };
      const rows: FormulaValue[][] = [];
      for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
        const values: FormulaValue[] = [];
        for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) {
          const cell = sheet.cells.get(`${columnName(col)}${row}`);
          values.push(cell ? cellValue(cell) : null);
        }
        rows.push(values);
      }
      return { kind: 'range', rows };
    },
  };
}

function cellValue(cell: ExcelCell): FormulaValue {
  if (cell.type === 'number') {
    const value = Number(cell.value.replace(/,/g, ''));
    return Number.isFinite(value) ? value : cell.value;
  }
  if (cell.type === 'boolean') return cell.value === 'TRUE';
  if (cell.type === 'empty') return null;
  return cell.value;
}

export function recalculateSheet(sheet: ExcelSheet): string[] {
  const formulas = new Map<string, ExcelCell>();
  for (const [ref, cell] of sheet.cells) if (cell.formula) formulas.set(ref, cell);
  const dependencies = new Map<string, string[]>();
  for (const [ref, cell] of formulas) dependencies.set(ref, referencedCells(cell.formula ?? ''));

  const sorted: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const circular = new Set<string>();

  const visit = (ref: string): void => {
    if (visited.has(ref)) return;
    if (visiting.has(ref)) {
      circular.add(ref);
      return;
    }
    visiting.add(ref);
    for (const dep of dependencies.get(ref) ?? []) {
      if (formulas.has(dep)) visit(dep);
    }
    visiting.delete(ref);
    visited.add(ref);
    sorted.push(ref);
  };
  for (const ref of formulas.keys()) visit(ref);

  const ctx = createContext(sheet);
  const changed: string[] = [];
  for (const ref of sorted) {
    if (circular.has(ref)) {
      const cell = formulas.get(ref)!;
      cell.value = '#CIRCULAR!';
      cell.type = 'error';
      changed.push(ref);
      continue;
    }
    const cell = formulas.get(ref)!;
    const value = evaluateFormula(sheet, cell.formula ?? '');
    if (cell.value !== value) {
      cell.value = value;
      cell.type = value.startsWith('#') ? 'error' : Number.isFinite(Number(value.replace(/,/g, ''))) ? 'number' : 'string';
      changed.push(ref);
    }
  }
  return [...new Set(changed)];
}

function referencedCells(formula: string): string[] {
  const refs: string[] = [];
  const range = /([A-Z]+\d+):([A-Z]+\d+)/gi;
  let match: RegExpExecArray | null;
  while ((match = range.exec(formula)) !== null) {
    const a = parseRef(match[1]); const b = parseRef(match[2]);
    if (!a || !b) continue;
    for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
      for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) refs.push(`${columnName(col)}${row}`);
    }
  }
  const single = /(?<![A-Z0-9])([A-Z]{1,3}\d+)(?![A-Z0-9])/gi;
  while ((match = single.exec(formula)) !== null) refs.push(match[1].toUpperCase());
  return [...new Set(refs)];
}

export function parseRef(value: string): { row: number; col: number } | null {
  const match = /^([A-Z]+)(\d+)$/i.exec(value);
  if (!match) return null;
  return { col: columnNameToNumber(match[1]), row: Number(match[2]) };
}

function columnNameToNumber(letters: string): number {
  let value = 0;
  for (const char of letters.toUpperCase()) value = value * 26 + (char.charCodeAt(0) - 64);
  return value;
}

export function columnName(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}

export function catalogueSize(): number {
  return Object.keys(FUNCTIONS).length;
}
