// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomTinyMceCollab from './CustomTinymceCollab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<CustomTinyMceCollab />} />
      </Routes>
    </Router>
  );
}

export default App;