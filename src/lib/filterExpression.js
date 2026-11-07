// Small, allow-listed evaluator for pipeline filter expressions.
// Supports: field names, 'strings', numbers, true/false/null, = != <> == > < >= <=,
// AND OR NOT, IN (...), NOT IN (...), LIKE '%text%', parentheses, TODAY(), NOW(), DATE_SUB(date, n).
// Never compiles the string into code — unparseable input simply matches nothing.

const OPERATORS = ['>=', '<=', '!=', '<>', '==', '=', '>', '<'];

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "'" || ch === '"') {
      let value = '';
      i++;
      while (i < input.length && input[i] !== ch) {
        if (input[i] === '\\' && i + 1 < input.length) { value += input[i + 1]; i += 2; continue; }
        value += input[i];
        i++;
      }
      if (i >= input.length) throw new Error('Unterminated string');
      i++;
      tokens.push({ type: 'literal', value });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(input[i + 1] || ''))) {
      const match = /^-?\d+(\.\d+)?/.exec(input.slice(i));
      tokens.push({ type: 'literal', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(i));
      tokens.push({ type: 'word', value: match[0] });
      i += match[0].length;
      continue;
    }
    if (ch === '(' || ch === ')' || ch === ',') { tokens.push({ type: ch }); i++; continue; }
    const op = OPERATORS.find((candidate) => input.startsWith(candidate, i));
    if (op) { tokens.push({ type: 'op', value: op }); i += op.length; continue; }
    throw new Error(`Unexpected character ${ch}`);
  }
  return tokens;
}

const keyword = (token) => (token && token.type === 'word' ? token.value.toUpperCase() : null);
const isKeyword = (token, ...names) => keyword(token) !== null && names.includes(keyword(token));

function compare(symbol, left, right) {
  const equal = symbol === '=' || symbol === '==' || symbol === '!=';
  const negate = symbol === '!=' || symbol === '<>';
  const bothNumbers = typeof left === 'number' && typeof right === 'number';
  if (equal) {
    const same = bothNumbers ? left === right : String(left ?? '') === String(right ?? '');
    return negate ? !same : same;
  }
  if (left === undefined || right === undefined) return false;
  const a = bothNumbers ? left : String(left);
  const b = bothNumbers ? right : String(right);
  if (symbol === '>') return a > b;
  if (symbol === '<') return a < b;
  if (symbol === '>=') return a >= b;
  return a <= b;
}

function like(value, pattern) {
  const source = String(pattern ?? '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${source}$`, 'i').test(String(value ?? ''));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDays(date, days) {
  const base = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

function parse(tokens, record) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  const parseOr = () => {
    let left = parseAnd();
    while (isKeyword(peek(), 'OR')) { next(); const right = parseAnd(); left = Boolean(left) || Boolean(right); }
    return left;
  };

  const parseAnd = () => {
    let left = parseNot();
    while (isKeyword(peek(), 'AND')) { next(); const right = parseNot(); left = Boolean(left) && Boolean(right); }
    return left;
  };

  const parseNot = () => {
    if (isKeyword(peek(), 'NOT') && !isKeyword(tokens[pos + 1], 'IN')) { next(); return !parseNot(); }
    return parseComparison();
  };

  const parseComparison = () => {
    const left = parsePrimary();
    const token = peek();
    if (token && token.type === 'op') {
      next();
      return compare(token.value, left, parsePrimary());
    }
    if (isKeyword(token, 'IN')) {
      next();
      return parseList().some((item) => compare('=', left, item));
    }
    if (isKeyword(token, 'NOT') && isKeyword(tokens[pos + 1], 'IN')) {
      next(); next();
      return !parseList().some((item) => compare('=', left, item));
    }
    if (isKeyword(token, 'LIKE')) {
      next();
      return like(left, parsePrimary());
    }
    return left;
  };

  const parseList = () => {
    if (!peek() || peek().type !== '(') throw new Error('Expected (');
    next();
    const items = [];
    while (peek() && peek().type !== ')') {
      items.push(parsePrimary());
      if (peek() && peek().type === ',') next();
    }
    if (!peek()) throw new Error('Unterminated list');
    next();
    return items;
  };

  const parsePrimary = () => {
    const token = next();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === '(') {
      const value = parseOr();
      if (!peek() || peek().type !== ')') throw new Error('Expected )');
      next();
      return value;
    }
    if (token.type === 'literal') return token.value;
    if (token.type === 'op' && token.value === '-') return -parsePrimary();
    if (token.type !== 'word') throw new Error('Unexpected token');

    const name = token.value;
    const upper = name.toUpperCase();
    if (upper === 'TRUE') return true;
    if (upper === 'FALSE') return false;
    if (upper === 'NULL') return null;

    if (peek() && peek().type === '(') {
      next();
      const args = [];
      while (peek() && peek().type !== ')') {
        args.push(parsePrimary());
        if (peek() && peek().type === ',') next();
      }
      if (!peek()) throw new Error('Unterminated call');
      next();
      if (upper === 'TODAY') return today();
      if (upper === 'NOW') return new Date().toISOString();
      if (upper === 'DATE_SUB') return shiftDays(args[0], Number(args[1]) || 0);
      throw new Error(`Unsupported function ${name}`);
    }

    return Object.hasOwn(record, name) ? record[name] : undefined;
  };

  const result = parseOr();
  if (pos !== tokens.length) throw new Error('Unexpected trailing input');
  return result;
}

/** Evaluates a filter expression against one record; any unparseable input is a non-match. */
export function matchesFilter(expression, record) {
  if (!expression || !String(expression).trim()) return true;
  try {
    return Boolean(parse(tokenize(String(expression)), record));
  } catch {
    return false;
  }
}