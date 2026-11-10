import { GridColumnDef } from './form.model';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenize arithmetic expression with numbers, operators (+, -, *, /), and parentheses.
 * Unary minus is supported.
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');
  while (i < s.length) {
    const ch = s[i];
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = '';
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) {
        num += s[i];
        i++;
      }
      tokens.push(num);
    } else if ('+-*/()'.includes(ch)) {
      // Check for unary minus: at start of expression or following another operator or '('
      if (ch === '-') {
        const prev = tokens[tokens.length - 1];
        if (!prev || '+-*/('.includes(prev)) {
          // Unary minus: attach to next number if possible, or push as unary token
          i++;
          let num = '-';
          while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) {
            num += s[i];
            i++;
          }
          if (num.length > 1) {
            tokens.push(num);
          } else {
            tokens.push('0');
            tokens.push('-');
          }
          continue;
        }
      }
      tokens.push(ch);
      i++;
    } else {
      // Skip unrecognized characters
      i++;
    }
  }
  return tokens;
}

/**
 * Safe arithmetic evaluator using shunting-yard algorithm (Dijkstra) and RPN stack.
 * Zero eval(), completely safe against injection.
 */
export function evaluateArithmetic(expr: string): number {
  if (!expr || !expr.trim()) return 0;
  const tokens = tokenize(expr);
  if (tokens.length === 0) return 0;

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if ('+-*/'.includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
        operatorStack.pop();
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op !== '(' && op !== ')') {
      outputQueue.push(op);
    }
  }

  // Evaluate RPN
  const evalStack: number[] = [];
  for (const token of outputQueue) {
    if (!isNaN(Number(token))) {
      evalStack.push(Number(token));
    } else if ('+-*/'.includes(token)) {
      const b = evalStack.pop() ?? 0;
      const a = evalStack.pop() ?? 0;
      switch (token) {
        case '+':
          evalStack.push(a + b);
          break;
        case '-':
          evalStack.push(a - b);
          break;
        case '*':
          evalStack.push(a * b);
          break;
        case '/':
          evalStack.push(b !== 0 ? a / b : 0);
          break;
      }
    }
  }

  return evalStack.length > 0 ? evalStack[0] : 0;
}

/**
 * Evaluate row-level formula for a single row given the formula string and columns definition.
 */
export function evaluateRowFormula(
  formula: string | undefined,
  row: Record<string, any>,
  columns: GridColumnDef[]
): number {
  if (!formula || !formula.trim()) return 0;
  let expr = formula.trim();

  // Sort columns by key length descending to avoid partial replacements
  const sortedCols = [...columns].sort((a, b) => b.key.length - a.key.length);

  for (const col of sortedCols) {
    let rawVal = row[col.key];
    // If referencing another formula column, calculate that first (single pass)
    if (col.type === 'FORMULA' && col.formula && col.formula !== formula) {
      rawVal = evaluateRowFormula(col.formula, row, columns.filter((c) => c.key !== col.key));
    }
    const num = Number(rawVal);
    const safeNum = Number.isFinite(num) ? num : 0;

    // Replace [key]
    const bracketRegex = new RegExp('\\[' + escapeRegExp(col.key) + '\\]', 'gi');
    expr = expr.replace(bracketRegex, String(safeNum));

    // Replace word-boundary key
    const wordRegex = new RegExp('\\b' + escapeRegExp(col.key) + '\\b', 'gi');
    expr = expr.replace(wordRegex, String(safeNum));
  }

  try {
    const result = evaluateArithmetic(expr);
    if (!Number.isFinite(result)) return 0;
    return Math.round(result * 10000) / 10000;
  } catch {
    return 0;
  }
}

/**
 * Compute column summary for the footer row across all rows.
 */
export function evaluateColumnSummary(
  col: GridColumnDef,
  rows: Array<Record<string, any>>,
  allColumns: GridColumnDef[]
): string {
  const summaryType = col.summary;
  if (!summaryType || summaryType === 'NONE' || !rows || rows.length === 0) {
    return '';
  }

  if (summaryType === 'COUNT') {
    return String(rows.length);
  }

  const values: number[] = rows.map((r) => {
    let v: any = r[col.key];
    if (col.type === 'FORMULA') {
      v = evaluateRowFormula(col.formula, r, allColumns);
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });

  if (values.length === 0) return '0';

  switch (summaryType) {
    case 'SUM': {
      const sum = values.reduce((acc, cur) => acc + cur, 0);
      return formatGridNumber(Math.round(sum * 10000) / 10000);
    }
    case 'AVG': {
      const sum = values.reduce((acc, cur) => acc + cur, 0);
      const avg = sum / values.length;
      return formatGridNumber(Math.round(avg * 100) / 100);
    }
    case 'MIN': {
      const min = Math.min(...values);
      return formatGridNumber(min);
    }
    case 'MAX': {
      const max = Math.max(...values);
      return formatGridNumber(max);
    }
    default:
      return '';
  }
}

/**
 * Helper to format numbers with commas for thousands.
 */
export function formatGridNumber(val: number | string): string {
  if (val === '' || val == null) return '';
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

