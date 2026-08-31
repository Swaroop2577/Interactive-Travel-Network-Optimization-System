
import React, { useState } from 'react';
import MapView from '../components/MapView';
import { useGraph } from '../context/GraphContext';
import { runDijkstra } from '../utils/algorithms/dijkstra';
import { runPrims } from '../utils/algorithms/prims';
import { runKruskals } from '../utils/algorithms/kruskals';

const METRIC_LABELS = {
  distance: { label: 'By Distance', unit: 'km' },
  cost: { label: 'By Cost', unit: '₹' },
  time: { label: 'By Travel Time', unit: 'h' },
};

const PlannerPage = () => {
  const { nodes, edges } = useGraph();
  const [algoType, setAlgoType] = useState('shortestPath');
  const [mstAlgo, setMstAlgo] = useState('prims');
  const [startNodeId, setStartNodeId] = useState('');
  const [endNodeId, setEndNodeId] = useState('');
  const [shortestPathMetric, setShortestPathMetric] = useState('distance');
  const [cheapestNetworkMetric, setCheapestNetworkMetric] = useState('cost');

  const [results, setResults] = useState(null);

  const handleRunAlgorithm = () => {
    setResults(null);

    if (algoType === 'shortestPath') {
      if (!startNodeId || !endNodeId) return;
      const algoResult = runDijkstra(nodes, edges, startNodeId, endNodeId, shortestPathMetric);
      setResults({ type: 'shortestPath', algo: 'dijkstra', data: algoResult });
    } else if (algoType === 'cheapestNetwork') {
      if (nodes.length === 0) return;
      const algoResult =
        mstAlgo === 'prims'
          ? runPrims(nodes, edges, cheapestNetworkMetric)
          : runKruskals(nodes, edges, cheapestNetworkMetric);
      setResults({ type: 'mst', algo: mstAlgo, data: algoResult });
    }
  };

  const highlightedPath = results?.type === 'shortestPath' ? results.data.path : [];
  const highlightedEdges = results?.type === 'mst' ? results.data.tree : [];

  return (
    <div className="page planner-page">
      <h1 className="page-title">Travel Planner</h1>
      <div className="content-container">
        <aside className="forms-panel">
          <section className="form-section">
            <h2>Select Goal</h2>
            <select
              className="select-goal"
              value={algoType}
              onChange={(e) => {
                setAlgoType(e.target.value);
                setResults(null);
              }}
            >
              <option value="shortestPath">Shortest Path</option>
              <option value="cheapestNetwork">Cheapest Network</option>
            </select>
          </section>

          {algoType === 'shortestPath' && (
            <section className="form-section">
              <h2>Shortest Path Options</h2>
              <p className="note">Algorithm: **Dijkstra's** (weighted)</p>
              <select value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)}>
                <option value="">Start City</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <select value={endNodeId} onChange={(e) => setEndNodeId(e.target.value)}>
                <option value="">End City</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <select value={shortestPathMetric} onChange={(e) => setShortestPathMetric(e.target.value)}>
                {Object.entries(METRIC_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button onClick={handleRunAlgorithm} className="button primary-button">
                Find Path
              </button>
            </section>
          )}

          {algoType === 'cheapestNetwork' && (
            <section className="form-section">
              <h2>Cheapest Network Options</h2>
              <select value={mstAlgo} onChange={(e) => setMstAlgo(e.target.value)}>
                <option value="prims">Prim's</option>
                <option value="kruskals">Kruskal's</option>
              </select>
              <select value={cheapestNetworkMetric} onChange={(e) => setCheapestNetworkMetric(e.target.value)}>
                {Object.entries(METRIC_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button onClick={handleRunAlgorithm} className="button primary-button">
                Find Network
              </button>
            </section>
          )}

          <section className="output-section">
            <h2>Results</h2>
            {results && (
              <>
                {results.type === 'shortestPath' && results.data.path.length > 0 ? (
                  <>
                    <h3 className="result-title">Dijkstra's Path</h3>
                    <p>
                      Path: **{results.data.path.map((id) => nodes.find((n) => n.id === id)?.label).join(' → ')}**
                    </p>
                    <p>
                      Total {shortestPathMetric}: **{results.data.distance} {METRIC_LABELS[shortestPathMetric].unit}**
                    </p>
                  </>
                ) : results.type === 'shortestPath' ? (
                  <p>No path found.</p>
                ) : null}

                {results.type === 'mst' && (
                  <>
                    <h3 className="result-title">Cheapest Network ({mstAlgo.toUpperCase()})</h3>
                    <p>
                      Minimum {cheapestNetworkMetric}: **{results.data.cost} {METRIC_LABELS[cheapestNetworkMetric].unit}**
                    </p>
                    <p>Total Edges: {results.data.tree.length}</p>
                  </>
                )}
              </>
            )}
          </section>
        </aside>

        <main className="graph-and-output-panel">
          <section className="graph-container">
            <MapView nodes={nodes} edges={edges} highlightedPath={highlightedPath} highlightedEdges={highlightedEdges} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default PlannerPage;