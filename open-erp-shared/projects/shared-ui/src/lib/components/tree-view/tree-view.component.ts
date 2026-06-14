import { Component, input, output, signal, forwardRef } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  [key: string]: any;
}

@Component({
  selector: 'oerp-tree-view',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    NgIf,
    TranslocoPipe,
    IconComponent,
    forwardRef(() => TreeViewComponent)
  ],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent {
  nodes = input.required<TreeNode[]>();
  activeNodeId = input<string | null>(null);
  enableDragAndDrop = input<boolean>(false);
  level = input<number>(0);

  nodeSelected = output<TreeNode>();
  nodeDropped = output<{ nodeId: string; targetParentId: string | null }>();

  expandedNodes = signal<Set<string>>(new Set<string>());
  dragOverNodeId = signal<string | null>(null);
  isDragOverRoot = signal<boolean>(false);

  toggleExpand(nodeId: string, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.expandedNodes());
    if (current.has(nodeId)) {
      current.delete(nodeId);
    } else {
      current.add(nodeId);
    }
    this.expandedNodes.set(current);
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedNodes().has(nodeId);
  }

  onSelectNode(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.nodeSelected.emit(node);
  }

  // HTML5 Drag and Drop handlers
  onDragStart(event: DragEvent, node: TreeNode): void {
    if (!this.enableDragAndDrop()) return;
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', node.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, node: TreeNode): void {
    if (!this.enableDragAndDrop()) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.dragOverNodeId() !== node.id) {
      this.dragOverNodeId.set(node.id);
    }
  }

  onDragLeave(event: DragEvent, node: TreeNode): void {
    if (!this.enableDragAndDrop()) return;
    event.stopPropagation();
    if (this.dragOverNodeId() === node.id) {
      this.dragOverNodeId.set(null);
    }
  }

  onDrop(event: DragEvent, targetNode: TreeNode): void {
    if (!this.enableDragAndDrop()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragOverNodeId.set(null);

    const nodeId = event.dataTransfer?.getData('text/plain');
    if (nodeId && nodeId !== targetNode.id) {
      // Pass the drop event up
      this.nodeDropped.emit({ nodeId, targetParentId: targetNode.id });
    }
  }

  // Root level drop handlers (for moving nodes to top-level parentId = null)
  onDragOverRoot(event: DragEvent): void {
    if (!this.enableDragAndDrop() || this.level() !== 0) return;
    event.preventDefault();
    if (!this.isDragOverRoot()) {
      this.isDragOverRoot.set(true);
    }
  }

  onDragLeaveRoot(event: DragEvent): void {
    if (!this.enableDragAndDrop() || this.level() !== 0) return;
    this.isDragOverRoot.set(false);
  }

  onDropRoot(event: DragEvent): void {
    if (!this.enableDragAndDrop() || this.level() !== 0) return;
    event.preventDefault();
    this.isDragOverRoot.set(false);

    const nodeId = event.dataTransfer?.getData('text/plain');
    if (nodeId) {
      this.nodeDropped.emit({ nodeId, targetParentId: null });
    }
  }

  // Forward child tree drag-dropped events to parent tree outputs
  onChildNodeDropped(event: { nodeId: string; targetParentId: string | null }): void {
    this.nodeDropped.emit(event);
  }

  onChildNodeSelected(node: TreeNode): void {
    this.nodeSelected.emit(node);
  }
}
