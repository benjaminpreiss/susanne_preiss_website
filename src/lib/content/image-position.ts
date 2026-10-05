import { lexer, parse, walk } from 'css-tree';

/** Validate a self-contained CSS position, without accepting extra declarations. */
export function isImagePosition(value: string): boolean {
  try {
    const ast = parse(value, { context: 'value' });
    if (lexer.matchType('position', ast).error) return false;
    let valid = true;
    // Property matching treats math functions as opaque; validate their arguments too.
    walk(ast, (node) => {
      if (node.type === 'Function' && lexer.matchType(`${node.name.toLowerCase()}()`, node).error)
        valid = false;
    });
    return valid;
  } catch {
    return false;
  }
}
