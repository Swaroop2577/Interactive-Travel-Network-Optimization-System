// src/pages/GraphBuilder.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import { useGraph } from '../context/GraphContext';
import { geocodeCity } from '../utils/geo';
import { getDrivingMatrix } from '../utils/osrm';

const GraphBuilder = () => {
  const { nodes, edges, addNode, deleteNode, buildCompleteGraph, clearGraph, undo, canUndo } = useGraph();

  const [cityName, setCityName] = useState('');
  const [geoError, setGeoError] = useState('');
  const [loadingCity, setLoadingCity] = useState(false);

  const [costPerKm, setCostPerKm] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [kNeighbors, setKNeighbors] = useState(3);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) return;
    setLoadingCity(true);
    setGeoError('');
    try {
      const { lat, lng } = await geocodeCity(cityName.trim());
      addNode(cityName.trim(), lat, lng);
      setCityName('');
    } catch (err) {
      setGeoError(err.message);
    } finally {
      setLoadingCity(false);
    }
  };

  const handleBuildNetwork = async () => {
    if (nodes.length < 2) {
      setBuildError('Add at least 2 cities first.');
      return;
    }

    setBuilding(true);
    setBuildError('');

    try {
      const matrix = await getDrivingMatrix(nodes);

      // Build a full pairwise edge list first (with distance/time/cost), same as before.
      const allEdges = [];
      // edgeLookup[i][j] lets us quickly find the edge object between node i and node j.
      const edgeLookup = nodes.map(() => new Map());

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const cell = matrix[i][j];
          if (!cell) continue; // no driving route found between these two

          const edge = {
            source: nodes[i].id,
            target: nodes[j].id,
            distance: cell.distanceKm,
            time: cell.durationHours,
            // Cost now blends distance (fuel) and time (driver/time cost) instead of
            // being a pure multiple of distance, so "By Cost" can diverge from "By Distance".
            cost: Math.round(cell.distanceKm * costPerKm + cell.durationHours * hourlyRate),
          };

          allEdges.push(edge);
          edgeLookup[i].set(j, edge);
          edgeLookup[j].set(i, edge);
        }
      }

      // k-Nearest-Neighbors filtering: each city only keeps edges to its k closest
      // cities (by distance), instead of connecting to every other city. This forces
      // Dijkstra to route through intermediate cities rather than always finding a
      // direct edge, since real road networks aren't complete graphs either.
      const k = Math.max(1, Math.floor(kNeighbors) || 1);
      const keepPair = new Set(); // holds "i-j" (i < j) for pairs kept by either side

      for (let i = 0; i < nodes.length; i++) {
        const neighborDistances = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const cell = matrix[i][j];
          if (!cell) continue;
          neighborDistances.push({ j, distance: cell.distanceKm });
        }

        neighborDistances.sort((a, b) => a.distance - b.distance);
        const nearest = neighborDistances.slice(0, k);

        nearest.forEach(({ j }) => {
          const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;
          keepPair.add(pairKey);
        });
      }

      const newEdges = allEdges.filter((edge) => {
        const i = nodes.findIndex((n) => n.id === edge.source);
        const j = nodes.findIndex((n) => n.id === edge.target);
        const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;
        return keepPair.has(pairKey);
      });

      buildCompleteGraph(newEdges);
    } catch (err) {
      setBuildError(err.message);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="page graph-builder-page">
      <h1 className="page-title">Build Your Travel Network</h1>
      <div className="content-container">
        <aside className="forms-panel">
          <section className="form-section">
            <h2>Add Cities</h2>
            <form onSubmit={handleAddCity}>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="City Name (e.g., Mumbai)"
              />
              <button type="submit" className="button" disabled={loadingCity}>
                {loadingCity ? 'Locating…' : 'Add City'}
              </button>
            </form>
            {geoError && <p className="error-text">{geoError}</p>}
            <div className="city-list">
              {nodes.map((node) => (
                <span key={node.id} className="item-tag">
                  {node.label}
                  <button className="delete-btn" onClick={() => deleteNode(node.id)}>✕</button>
                </span>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>Build Network</h2>
            <label className="note">
              Cost per km (₹):
              <input
                type="number"
                value={costPerKm}
                onChange={(e) => setCostPerKm(+e.target.value)}
                style={{ width: '60px', marginLeft: '6px' }}
              />
            </label>
            <label className="note">
              Cost per hour (₹):
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(+e.target.value)}
                style={{ width: '60px', marginLeft: '6px' }}
              />
            </label>
            <label className="note">
              Connect each city to nearest (k):
              <input
                type="number"
                min="1"
                value={kNeighbors}
                onChange={(e) => setKNeighbors(+e.target.value)}
                style={{ width: '60px', marginLeft: '6px' }}
              />
            </label>
            <button className="button primary-button" onClick={handleBuildNetwork} disabled={building}>
              {building ? 'Building…' : 'Build Network'}
            </button>
            {buildError && <p className="error-text">{buildError}</p>}
            {edges.length > 0 && (
              <p className="note">{edges.length} routes generated (driving, road distance).</p>
            )}
          </section>

          <section className="form-section" style={{ display: 'flex', gap: '10%' }}>
            <button className="button" onClick={undo} disabled={!canUndo}>Undo</button>
            <button className="button danger-button" onClick={clearGraph}>Clear Graph</button>
          </section>
        </aside>

        <main className="graph-and-output-panel">
          <section className="graph-container">
            <MapView nodes={nodes} edges={edges} />
          </section>
          <div className="button-footer">
            <Link to="/plan" className="button primary-button">Continue to Planner</Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GraphBuilder;