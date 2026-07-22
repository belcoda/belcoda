/*
Emails are composed in a svelte-lexical editor, but rendered to HTML with
@tryghost/kg-lexical-html-renderer, which expects Ghost/Koenig image-card nodes.
The two serialize images differently:

- svelte-lexical: { type: 'image', src, altText, maxWidth, width, height, showCaption, caption: { editorState } }
  (inserted inline, wrapped inside a paragraph node)
- Ghost image card: { type: 'image', src, alt, title, caption, cardWidth, width, height, href }
  (a top-level decorator card, direct child of the root node)

This module normalizes a raw Lexical body into the Ghost shape: image nodes are
hoisted to top-level children of the root and their fields are remapped. It is a
purely structural JSON transformation — no HTML is emitted here.
*/

type LexicalNode = Record<string, unknown>;

export type GhostImageCardNode = {
	type: 'image';
	version: 1;
	src: string;
	alt: string;
	title: string;
	caption: string;
	cardWidth: 'regular';
	width: number | null;
	height: number | null;
	href: string;
};

function isRecord(value: unknown): value is LexicalNode {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImageNode(node: unknown): node is LexicalNode {
	return isRecord(node) && node.type === 'image';
}

/** An image node we can meaningfully render — it has a non-empty string src. */
export function isRenderableImageNode(node: unknown): node is LexicalNode & { src: string } {
	return isImageNode(node) && typeof node.src === 'string' && node.src.trim() !== '';
}

function collectTextContent(node: unknown): string {
	if (!isRecord(node)) {
		return '';
	}

	if (typeof node.text === 'string') {
		return node.text;
	}

	if (Array.isArray(node.children)) {
		return node.children
			.map(collectTextContent)
			.filter((text) => text !== '')
			.join(' ');
	}

	return '';
}

/*
svelte-lexical stores the caption as a nested Lexical editor state
({ editorState: { root: ... } }), while Ghost expects a string. Extract the
caption's plain text when captions are enabled for the node.
*/
function extractCaption(node: LexicalNode): string {
	if (typeof node.caption === 'string') {
		return node.caption;
	}

	if (node.showCaption !== true) {
		return '';
	}

	const caption = isRecord(node.caption) ? node.caption : undefined;
	const editorState = caption && isRecord(caption.editorState) ? caption.editorState : undefined;
	return collectTextContent(editorState?.root).trim();
}

function toDimension(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function toGhostImageCardNode(node: LexicalNode): GhostImageCardNode {
	return {
		type: 'image',
		version: 1,
		src: typeof node.src === 'string' ? node.src : '',
		alt:
			typeof node.altText === 'string'
				? node.altText
				: typeof node.alt === 'string'
					? node.alt
					: '',
		title: typeof node.title === 'string' ? node.title : '',
		caption: extractCaption(node),
		cardWidth: 'regular',
		width: toDimension(node.width),
		height: toDimension(node.height),
		href: typeof node.href === 'string' ? node.href : ''
	};
}

/*
Removes image nodes nested anywhere below the given node. Renderable ones are
returned (converted to the Ghost shape) so they can be re-inserted as top-level
cards. Image nodes without a usable src are dropped entirely: they can't render
anything, and leaving a node the renderer's Lexical editor doesn't recognize in
place makes parsing abort, silently truncating everything after it.

Works bottom-up: a child container is itself dropped from its parent's children
if extracting images left it with none (eg. a list item that only wrapped an
image, or a list whose only item was itself dropped this way) — unless it was
already empty in the input, which is left untouched.
*/
function extractNestedImageNodes(node: LexicalNode, extracted: GhostImageCardNode[]): void {
	if (!Array.isArray(node.children)) {
		return;
	}

	const remaining: unknown[] = [];
	for (const child of node.children) {
		if (isRenderableImageNode(child)) {
			extracted.push(toGhostImageCardNode(child));
			continue;
		}
		if (isImageNode(child)) {
			continue;
		}

		if (isRecord(child) && Array.isArray(child.children)) {
			const childCountBefore = child.children.length;
			extractNestedImageNodes(child, extracted);

			// Drop the child if it only contained images/emptied descendants
			// (childCountBefore === 0 means it was already empty — keep it as-is).
			if (childCountBefore > 0 && child.children.length === 0) {
				continue;
			}
		}
		remaining.push(child);
	}
	node.children = remaining;
}

/*
Splits a root-level container at each of its DIRECT renderable-image children,
so the rendered order interleaves the container's own content with the images
in place (eg. a paragraph with children [text A, image, text B] becomes
[paragraph(A), image card, paragraph(B)]) instead of hoisting every image to
after the whole container. Non-image siblings still get their own nested
images (deeper than one level) extracted via extractNestedImageNodes; those
cards are emitted at the top level immediately after the segment containing
the sibling.

Src-less images among the direct children are dropped entirely (not split
points) — same "can't render, would break parsing" rule as elsewhere.

Returns the split-out nodes (container copies and Ghost image cards,
interleaved in order); empty container copies (a segment with no children) are
omitted.
*/
function splitContainerAtDirectImages(
	container: LexicalNode,
	directChildren: unknown[]
): unknown[] {
	const result: unknown[] = [];
	let segment: unknown[] = [];

	function flushSegment() {
		if (segment.length === 0) {
			return;
		}
		result.push({ ...container, children: segment });
		segment = [];
	}

	for (const directChild of directChildren) {
		if (isRenderableImageNode(directChild)) {
			flushSegment();
			result.push(toGhostImageCardNode(directChild));
			continue;
		}
		if (isImageNode(directChild)) {
			continue;
		}

		if (isRecord(directChild) && Array.isArray(directChild.children)) {
			const childCountBefore = directChild.children.length;
			const extracted: GhostImageCardNode[] = [];
			extractNestedImageNodes(directChild, extracted);

			if (childCountBefore === 0 || directChild.children.length > 0) {
				segment.push(directChild);
			}
			// Image cards must land at the root level, not inside the container
			// copy — the renderer treats nested image nodes as unparseable.
			if (extracted.length > 0) {
				flushSegment();
				result.push(...extracted);
			}
			continue;
		}

		segment.push(directChild);
	}
	flushSegment();

	return result;
}

function normalizeRootChildren(children: unknown[]): unknown[] {
	const normalized: unknown[] = [];

	for (const child of children) {
		if (isRenderableImageNode(child)) {
			normalized.push(toGhostImageCardNode(child));
			continue;
		}
		if (isImageNode(child)) {
			continue;
		}

		if (isRecord(child) && Array.isArray(child.children)) {
			if (child.children.some(isRenderableImageNode)) {
				normalized.push(...splitContainerAtDirectImages(child, child.children));
				continue;
			}

			const childCountBefore = child.children.length;
			const extracted: GhostImageCardNode[] = [];
			extractNestedImageNodes(child, extracted);

			// Keep the containing node unless removing its images left it empty
			// (eg. a paragraph that only wrapped an image).
			if (child.children.length === childCountBefore || child.children.length > 0) {
				normalized.push(child);
			}
			normalized.push(...extracted);
			continue;
		}

		normalized.push(child);
	}

	return normalized;
}

/*
Returns a deep-cloned copy of the Lexical body with svelte-lexical image nodes
remapped to Ghost image-card nodes and hoisted to top-level children of the
root. The input is never mutated. Non-image nodes pass through unchanged.
*/
export function normalizeLexicalBody<T>(body: T): T {
	const cloned = structuredClone(body);

	if (!isRecord(cloned)) {
		return cloned;
	}

	const root = cloned.root;
	if (!isRecord(root) || !Array.isArray(root.children)) {
		return cloned;
	}

	root.children = normalizeRootChildren(root.children);
	return cloned;
}
