import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GraphBuilder from './pages/GraphBuilder';
import PlannerPage from './pages/PlannerPage';
import { GraphProvider } from './context/GraphContext';
import './styles.css';

const App = () => {
  return (
    <GraphProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/build" element={<GraphBuilder />} />
          <Route path="/plan" element={<PlannerPage />} />
        </Routes>
      </BrowserRouter>
    </GraphProvider>
  );
};

export default App;