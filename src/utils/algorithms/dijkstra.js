// Sums each of distance/cost/time along a resolved path, independent of which
// metric Dijkstra optimized for. Lets the UI show "Distance: X km, Cost: ₹Y,
// Time: Zh" together even though the algorithm only minimized one of them.
const getPathMetrics = (edges, path) => {
  const totals = { distance: 0, cost: 0, time: 0 };
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = edges.find(
      (e) => (e.source === a && e.target === b) || (e.source === b && e.target === a)
    );
    if (edge) {
      totals.distance += edge.distance || 0;
      totals.cost += edge.cost || 0;
      totals.time += edge.time || 0;
    }
  }
  return totals;
};

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
    return { path: [], distance: Infinity, metrics: { distance: 0, cost: 0, time: 0 }, steps };
  }

  return { path, distance: distances[endNodeId], metrics: getPathMetrics(edges, path), steps };
};