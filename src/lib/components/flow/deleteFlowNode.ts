type DeleteElements = (params: {
	nodes?: { id: string }[];
	edges?: { id: string }[];
}) => Promise<unknown>;

export async function deleteFlowNode(deleteElements: DeleteElements, nodeId: string) {
	if (!window.confirm('Are you sure you want to delete this node?')) return;
	await deleteElements({ nodes: [{ id: nodeId }] });
}
