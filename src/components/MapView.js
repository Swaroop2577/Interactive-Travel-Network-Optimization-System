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

// Small colored dot icons used for animation/final-state highlighting.
// Leaflet's default marker asset can't be recolored per-instance, so we use
// lightweight DivIcons that match the SVG visualization's palette.
const dotIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background:${color}; border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });

const redIcon = dotIcon('#e53935');
const purpleIcon = dotIcon('#9c27b0');
const defaultIcon = new L.Icon.Default();

// Colors mirror the SVG visualization's CSS variables (see styles.css) so the
// map animation looks consistent with the rest of the app.
const COLORS = {
  default: '#457b9d',
  final: '#e53935',        // .final-path-edge / .final-path-node
  primsHighlight: '#ffc107', // .prims-highlight — edge currently being considered
  primsAdded: '#4caf50',     // .prims-added — edge already added to the MST
  kruskalsHighlight: '#03a9f4', // .kruskals-highlight
  kruskalsAdded: '#8bc34a',     // .kruskals-added
  visited: '#9c27b0',        // .visited-node
};

const MapView = ({
  nodes,
  edges,
  highlightedPath = [],
  highlightedEdges = [],
  visualizationStep = {},
  algorithmType,
}) => {
  const defaultCenter = [20.5937, 78.9629]; // India, fallback
  const center = nodes.length ? [nodes[0].lat, nodes[0].lng] : defaultCenter;

  const vizStep = visualizationStep || {};
  const isFinalStep = !!vizStep.final;

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

  const sameEdge = (a, b) =>
    a &&
    b &&
    ((a.source === b.source && a.target === b.target) ||
      (a.source === b.target && a.target === b.source));

  // Determine the animated (non-final) style for an edge based on the current step.
  const getInProgressStyle = (edge) => {
    if (isFinalStep) return null;

    if (algorithmType === 'prims') {
      if (sameEdge(vizStep.highlightedEdge, edge)) {
        return { color: COLORS.primsHighlight, weight: 5, opacity: 1 };
      }
      if (vizStep.addedEdges?.some((e) => sameEdge(e, edge))) {
        return { color: COLORS.primsAdded, weight: 4, opacity: 1 };
      }
    }

    if (algorithmType === 'kruskals') {
      if (sameEdge(vizStep.highlightedEdge, edge)) {
        return { color: COLORS.kruskalsHighlight, weight: 5, opacity: 1 };
      }
      if (vizStep.mstEdges?.some((e) => sameEdge(e, edge))) {
        return { color: COLORS.kruskalsAdded, weight: 4, opacity: 1 };
      }
    }

    return null;
  };

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

        const finalHighlighted = isFinalStep && (isInPath(edge) || isInMst(edge));
        const inProgressStyle = getInProgressStyle(edge);

        const pathOptions = finalHighlighted
          ? { color: COLORS.final, weight: 5, opacity: 1 }
          : inProgressStyle || { color: COLORS.default, weight: 2, opacity: 0.5 };

        return (
          <Polyline
            key={idx}
            positions={[[source.lat, source.lng], [target.lat, target.lng]]}
            pathOptions={pathOptions}
          />
        );
      })}

      {nodes.map((node) => {
        // Dijkstra's animation: nodes already visited/settled.
        const isDijkstraVisited =
          !isFinalStep && algorithmType === 'dijkstra' && vizStep.visitedNodes?.includes(node.id);
        // Prim's animation: nodes already pulled into the growing tree.
        const isPrimVisited =
          !isFinalStep && algorithmType === 'prims' && vizStep.visited?.has(node.id);
        // Kruskal's animation: nodes already part of the same component as the tree.
        const isKruskalComponentNode =
          !isFinalStep && algorithmType === 'kruskals' && vizStep.mstNodes?.includes(node.id);

        const isVisited = isDijkstraVisited || isPrimVisited || isKruskalComponentNode;
        const isFinalNode =
          isFinalStep &&
          (highlightedPath.includes(node.id) ||
            highlightedEdges.some((e) => e.source === node.id || e.target === node.id));

        const icon = isFinalNode
          ? redIcon
          : isVisited
          ? purpleIcon
          : defaultIcon;

        return (
          <Marker key={node.id} position={[node.lat, node.lng]} icon={icon}>
            <Popup>{node.label}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;