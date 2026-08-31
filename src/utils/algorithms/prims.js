export const runPrims = (nodes, edges, edgeType) => {
  if (nodes.length === 0) return { tree: [], cost: 0, steps: [] };

  const adjList = new Map();
  nodes.forEach((node) => adjList.set(node.id, []));
  edges.forEach((edge) => {
    adjList.get(edge.source).push({ node: edge.target, weight: edge[edgeType], originalEdge: edge });
    adjList.get(edge.target).push({ node: edge.source, weight: edge[edgeType], originalEdge: edge });
  });

  const mstEdges = [];
  const visited = new Set();
  const priorityQueue = [];
  let totalCost = 0;
  const steps = [];

  let startNode = nodes[0].id;
  visited.add(startNode);
  
  steps.push({
    type: 'prims',
    visited: new Set(visited),
    addedEdges: [],
    highlightedEdge: null,
  });

  adjList.get(startNode).forEach((neighbor) => {
    priorityQueue.push({ source: startNode, target: neighbor.node, weight: neighbor.weight, originalEdge: neighbor.originalEdge });
  });
  priorityQueue.sort((a, b) => a.weight - b.weight);

  while (priorityQueue.length > 0 && visited.size < nodes.length) {
    const minEdge = priorityQueue.shift();
    const { source, target, weight, originalEdge } = minEdge;

    if (visited.has(target)) {
      continue;
    }
    
    steps.push({
      type: 'prims',
      visited: new Set(visited),
      addedEdges: [...mstEdges],
      highlightedEdge: { source, target },
    });

    visited.add(target);
    mstEdges.push(originalEdge);
    totalCost += weight;

    adjList.get(target).forEach((neighbor) => {
      if (!visited.has(neighbor.node)) {
        priorityQueue.push({ source: target, target: neighbor.node, weight: neighbor.weight, originalEdge: neighbor.originalEdge });
      }
    });
    priorityQueue.sort((a, b) => a.weight - b.weight);
  }

  steps.push({
    type: 'prims',
    final: true,
    tree: mstEdges,
  });

  return { tree: mstEdges, cost: totalCost, steps };
};