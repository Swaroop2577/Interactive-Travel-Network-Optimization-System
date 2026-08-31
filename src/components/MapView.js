// src/components/MapView.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = ({ nodes, edges, highlightedPath = [], highlightedEdges = [] }) => {
  const defaultCenter = [20.5937, 78.9629]; // India, fallback
  const center = nodes.length ? [nodes[0].lat, nodes[0].lng] : defaultCenter;

  const isInPath = (edge) => {
    const i1 = highlightedPath.indexOf(edge.source);
    const i2 = highlightedPath.indexOf(edge.target);
    return i1 !== -1 && i2 !== -1 && Math.abs(i1 - i2) === 1;
  };

  const isInMst = (edge) =>
    highlightedEdges.some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source)
    );

  return (
    <MapContainer center={center} zoom={5} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {edges.map((edge, idx) => {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source || !target) return null;

        const highlighted = isInPath(edge) || isInMst(edge);

        return (
          <Polyline
            key={idx}
            positions={[[source.lat, source.lng], [target.lat, target.lng]]}
            pathOptions={{
              color: highlighted ? '#e63946' : '#457b9d',
              weight: highlighted ? 5 : 2,
              opacity: highlighted ? 1 : 0.5,
            }}
          />
        );
      })}

      {nodes.map((node) => (
        <Marker key={node.id} position={[node.lat, node.lng]}>
          <Popup>{node.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;