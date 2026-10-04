import { DepartmentNode, FlatDepartmentNode } from '../models';

/**
 * Flattens a department tree into a depth-annotated list.
 * `ponytail:` recursive; iterative only if trees get pathologically deep.
 */
export function flattenDepartments(
  nodes: DepartmentNode[],
  depth = 0,
  acc: FlatDepartmentNode[] = []
): FlatDepartmentNode[] {
  for (const node of nodes) {
    acc.push({ ...node, depth });
    if (node.children?.length) {
      flattenDepartments(node.children, depth + 1, acc);
    }
  }
  return acc;
}
