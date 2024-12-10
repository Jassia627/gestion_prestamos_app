import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;