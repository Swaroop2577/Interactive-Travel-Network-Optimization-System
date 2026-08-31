export const runDijkstra = (nodes, edges, startNodeId, endNodeId, edgeType) => {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const nodesSet = new Set(nodes.map((n) => n.id));
  const steps = [];

  for (const nodeId of nodesSet) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  }
  distances[startNodeId] = 0;

  const adjList = new Map();
  nodes.forEach((node) => adjList.set(node.id, []));
  edges.forEach((edge) => {
    adjList.get(edge.source).push({ node: edge.target, weight: edge[edgeType] });
    adjList.get(edge.target).push({ node: edge.source, weight: edge[edgeType] });
  });

  let currentNode = startNodeId;
  while (currentNode) {
    steps.push({
      type: 'dijkstra',
      highlightedNodes: [currentNode],
      visitedNodes: Array.from(visited),
      currentDistances: { ...distances },
    });

    if (visited.has(currentNode)) {
      currentNode = null;
      continue;
    }
    visited.add(currentNode);

    const neighbors = adjList.get(currentNode) || [];
    for (const neighbor of neighbors) {
      const newDistance = distances[currentNode] + neighbor.weight;
      if (newDistance < distances[neighbor.node]) {
        distances[neighbor.node] = newDistance;
        previous[neighbor.node] = currentNode;
      }
    }

    let minDistance = Infinity;
    let nextNode = null;
    for (const node of nodesSet) {
      if (!visited.has(node) && distances[node] < minDistance) {
        minDistance = distances[node];
        nextNode = node;
      }
    }
    currentNode = nextNode;
  }
  
  const path = [];
  let current = endNodeId;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  steps.push({
    type: 'dijkstra',
    final: true,
    path: path,
  });

  if (path[0] !== startNodeId) {
    return { path: [], distance: Infinity, steps };
  }

  return { path, distance: distances[endNodeId], steps };
};