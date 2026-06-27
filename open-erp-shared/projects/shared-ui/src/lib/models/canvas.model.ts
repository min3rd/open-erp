export type NodeType = 'start' | 'end' | 'step' | 'gateway' | 'fork' | 'subprocess' | 'custom';
export type NodeStatus = 'idle' | 'active' | 'done' | 'rejected' | 'error';
export type EdgeType = 'straight' | 'orthogonal' | 'bezier';

export interface Assignee {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data: {
    label: string;
    description?: string;
    icon?: string;
    status?: NodeStatus;
    assignees?: Assignee[];
    deadline?: string;
    progress?: number;
    count?: { current: number; total: number };
    meta?: Record<string, unknown>;
  };
  style?: NodeStyle;
  selected?: boolean;
  locked?: boolean;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: EdgeType;
  animated?: boolean;
  data: {
    label?: string;
    condition?: string;
    color?: string;
  };
  style?: EdgeStyle;
  selected?: boolean;
}

export interface CanvasOptions {
  readOnly?: boolean;
  gridType?: 'dots' | 'lines' | 'none';
  snapToGrid?: boolean;
  snapGridSize?: number;
  defaultEdgeType?: EdgeType;
  minZoom?: number;
  maxZoom?: number;
  fitOnInit?: boolean;
  showMinimap?: boolean;
  showToolbar?: boolean;
  autoLayout?: 'dagre' | 'none';
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: { x: number; y: number; zoom: number };
}
