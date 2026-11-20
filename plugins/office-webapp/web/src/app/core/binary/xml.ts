import { OfficeBinaryError } from './magic-bytes';

export interface XmlNode {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

const encoder = new TextEncoder();

export function parseXml(source: string): XmlNode {
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  if (/<!DOCTYPE/i.test(source) || /<!ENTITY/i.test(source)) {
    throw new OfficeBinaryError('OFFICE_XML_UNSAFE');
  }
  const root: XmlNode = { name: '#document', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  let index = 0;
  const length = source.length;

  while (index < length) {
    const lt = source.indexOf('<', index);
    if (lt < 0) {
      appendText(stack[stack.length - 1], source.slice(index));
      break;
    }
    if (lt > index) {
      appendText(stack[stack.length - 1], source.slice(index, lt));
    }
    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      index = end < 0 ? length : end + 3;
      continue;
    }
    if (source.startsWith('<![CDATA[', lt)) {
      const end = source.indexOf(']]>', lt + 9);
      const text = source.slice(lt + 9, end < 0 ? length : end);
      appendText(stack[stack.length - 1], text);
      index = end < 0 ? length : end + 3;
      continue;
    }
    if (source.startsWith('<?', lt)) {
      const end = source.indexOf('?>', lt + 2);
      index = end < 0 ? length : end + 2;
      continue;
    }
    if (source.startsWith('</', lt)) {
      const end = source.indexOf('>', lt + 2);
      if (end < 0) throw new OfficeBinaryError('OFFICE_XML_MALFORMED');
      if (stack.length > 1) stack.pop();
      index = end + 1;
      continue;
    }
    const tag = readTag(source, lt);
    if (!tag) throw new OfficeBinaryError('OFFICE_XML_MALFORMED');
    const node: XmlNode = { name: tag.name, attrs: tag.attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!tag.selfClosing) stack.push(node);
    index = tag.end;
  }
  return root;
}

export function findChild(node: XmlNode | null, name: string): XmlNode | null {
  if (!node) return null;
  return node.children.find((child) => child.name === name) ?? null;
}

export function findChildren(node: XmlNode | null, name: string): XmlNode[] {
  return node ? node.children.filter((child) => child.name === name) : [];
}

export function descendants(node: XmlNode | null, name: string): XmlNode[] {
  if (!node) return [];
  const result: XmlNode[] = [];
  const walk = (current: XmlNode) => {
    for (const child of current.children) {
      if (child.name === name) result.push(child);
      walk(child);
    }
  };
  walk(node);
  return result;
}

export function textOf(node: XmlNode | null): string {
  if (!node) return '';
  let text = node.text;
  for (const child of node.children) text += textOf(child);
  return text;
}

export function attr(node: XmlNode | null, name: string): string | undefined {
  return node ? node.attrs[name] : undefined;
}

export function serializeXml(node: XmlNode): string {
  if (node.name === '#document') {
    return node.children.map(serializeXml).join('');
  }
  const attrs = Object.entries(node.attrs)
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join('');
  const body = `${escapeXml(node.text)}${node.children.map(serializeXml).join('')}`;
  return `<${node.name}${attrs}>${body}</${node.name}>`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, code: string) => {
    if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    switch (code) {
      case 'amp': return '&';
      case 'lt': return '<';
      case 'gt': return '>';
      case 'quot': return '"';
      case 'apos': return "'";
      default: return match;
    }
  });
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

export function encodeUtf8(value: string): Uint8Array {
  return encoder.encode(value);
}

interface TagResult {
  name: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
  end: number;
}

function readTag(source: string, start: number): TagResult | null {
  let index = start + 1;
  const name = readName(source, index);
  if (!name) return null;
  index = name.end;
  const attrs: Record<string, string> = {};
  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index])) index++;
    if (source.startsWith('/>', index)) {
      return { name: name.value, attrs, selfClosing: true, end: index + 2 };
    }
    if (source[index] === '>') {
      return { name: name.value, attrs, selfClosing: false, end: index + 1 };
    }
    const attrName = readName(source, index);
    if (!attrName) return null;
    index = attrName.end;
    while (index < source.length && /\s/.test(source[index])) index++;
    if (source[index] !== '=') return null;
    index++;
    while (index < source.length && /\s/.test(source[index])) index++;
    const quote = source[index];
    if (quote !== '"' && quote !== "'") return null;
    index++;
    const endQuote = source.indexOf(quote, index);
    if (endQuote < 0) return null;
    attrs[attrName.value] = decodeXmlEntities(source.slice(index, endQuote));
    index = endQuote + 1;
  }
  return null;
}

function readName(source: string, start: number): { value: string; end: number } | null {
  let index = start;
  while (index < source.length && /[A-Za-z0-9_:.-]/.test(source[index])) index++;
  return index === start ? null : { value: source.slice(start, index), end: index };
}

function appendText(node: XmlNode, raw: string): void {
  if (raw) node.text += decodeXmlEntities(raw);
}
