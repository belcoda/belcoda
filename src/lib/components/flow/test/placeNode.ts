/* Define:
anchor = (ax, ay) (usually parent node)
nodeWidth, nodeHeight
padding (extra spacing between nodes) */
import { type XYPosition } from '@xyflow/svelte';
type NodeRect = {
	id: string;
	type: string;
	position: XYPosition;
	width: number;
	height: number;
};

function overlaps(a: NodeRect, b: NodeRect, padding = 20): boolean {
	return !(
		a.position.x + a.width + padding < b.position.x ||
		a.position.x > b.position.x + b.width + padding ||
		a.position.y + a.height + padding < b.position.y ||
		a.position.y > b.position.y + b.height + padding
	);
}

function collides(candidate: NodeRect, nodes: NodeRect[], padding = 20): boolean {
	return nodes.some((n) => overlaps(candidate, n, padding));
}

export function findPositionRadial(
	anchorX: number,
	anchorY: number,
	width: number,
	height: number,
	existingNodes: NodeRect[]
): { x: number; y: number } | null {
	const step = 80; // distance between rings
	const maxRadius = 1000; // don't search forever
	const angleStep = 20; // how dense around circle

	const startAngle = 45; // start in bottom-right quadrant (45° = down-right)
	for (let radius = step; radius <= maxRadius; radius += step) {
		for (let i = 0; i < 360 / angleStep; i++) {
			const angle = (startAngle + i * angleStep) % 360;
			const rad = angle * (Math.PI / 180);

			const x = anchorX + radius * Math.cos(rad);
			const y = anchorY + radius * Math.sin(rad);

			const candidate: NodeRect = {
				id: 'new',
				type: 'node',
				position: { x, y },
				width: width,
				height: height
			};

			if (!collides(candidate, existingNodes)) {
				return { x, y };
			}
		}
	}

	return null;
}
