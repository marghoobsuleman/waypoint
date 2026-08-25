import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import Layout from './components/Layout.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/p/:slug" element={<ProjectDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
