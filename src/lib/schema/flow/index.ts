import { type XYPosition } from '@xyflow/svelte';

export type Flow = {
	nodes: Node[];
	edges: Edge[];
};

export type Node = {
	id: string;
	type: string;
	position: XYPosition;
};

export type Edge = {};
