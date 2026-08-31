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

      const newEdges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const cell = matrix[i][j];
          if (!cell) continue; // no driving route found between these two
          newEdges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            distance: cell.distanceKm,
            time: cell.durationHours,
            cost: Math.round(cell.distanceKm * costPerKm),
          });
        }
      }
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
            <button className="button primary-button" onClick={handleBuildNetwork} disabled={building}>
              {building ? 'Building…' : 'Build Network'}
            </button>
            {buildError && <p className="error-text">{buildError}</p>}
            {edges.length > 0 && (
              <p className="note">{edges.length} routes generated (driving, road distance).</p>
            )}
          </section>

          <section className="form-section">
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