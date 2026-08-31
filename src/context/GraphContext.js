// src/context/GraphContext.js
import React, { createContext, useState, useContext } from 'react';

const GraphContext = createContext();

export const GraphProvider = ({ children }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [history, setHistory] = useState([]);

  const pushHistory = () => setHistory((prev) => [...prev, { nodes, edges }]);

  const addNode = (label, lat, lng) => {
    pushHistory();
    const newId = `C${nodes.length + 1}`;
    setNodes((prev) => [...prev, { id: newId, label, lat, lng }]);
  };

  const deleteNode = (nodeId) => {
    pushHistory();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  // Replaces the entire edge set — used after building the complete graph
  const buildCompleteGraph = (newEdges) => {
    pushHistory();
    setEdges(newEdges);
  };

  const clearGraph = () => {
    pushHistory();
    setNodes([]);
    setEdges([]);
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setNodes(last.nodes);
      setEdges(last.edges);
      return prev.slice(0, -1);
    });
  };

  return (
    <GraphContext.Provider
      value={{
        nodes, edges, addNode, deleteNode, buildCompleteGraph, clearGraph, undo,
        canUndo: history.length > 0,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => useContext(GraphContext);