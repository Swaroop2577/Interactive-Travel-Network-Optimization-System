// Helper for Kruskal's Disjoint Set Union (DSU)
class DSU {
  constructor(nodes) {
    this.parent = {};
    this.rank = {};
    nodes.forEach(node => {
      this.parent[node.id] = node.id;
      this.rank[node.id] = 0;
    });
  }

  find(i) {
    if (this.parent[i] === i) {
      return i;
    }
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i, j) {
    let rootI = this.find(i);
    let rootJ = this.find(j);

    if (rootI !== rootJ) {
      if (this.rank[rootI] < this.rank[rootJ]) {
        this.parent[rootI] = rootJ;
      } else if (this.rank[rootI] > this.rank[rootJ]) {
        this.parent[rootJ] = rootI;
      } else {
        this.parent[rootJ] = rootI;
        this.rank[rootI]++;
      }
      return true;
    }
    return false;
  }
}

export const runKruskals = (nodes, edges, edgeType) => {
  if (nodes.length === 0) return { tree: [], cost: 0, steps: [] };

  const sortedEdges = [...edges].sort((a, b) => a[edgeType] - b[edgeType]);
  const dsu = new DSU(nodes);
  const mstEdges = [];
  let totalCost = 0;
  const steps = [];

  steps.push({
    type: 'kruskals',
    mstEdges: [],
    highlightedEdge: null,
    mstNodes: [],
  });

  for (const edge of sortedEdges) {
    steps.push({
      type: 'kruskals',
      mstEdges: [...mstEdges],
      highlightedEdge: edge,
      mstNodes: nodes.filter(node => dsu.find(node.id) === dsu.find(nodes[0].id)).map(node => node.id),
    });

    if (dsu.union(edge.source, edge.target)) {
      mstEdges.push(edge);
      totalCost += edge[edgeType];
    }
  }

  steps.push({
    type: 'kruskals',
    final: true,
    tree: mstEdges,
  });

  return { tree: mstEdges, cost: totalCost, steps };
};