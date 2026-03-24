import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AlgoLab from './pages/AlgoLab';
import Home from './pages/Home';
import Login from './pages/Login';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/lab" element={<AlgoLab />} />
          
          {/* Legacy routes redirected to the new unified lab */}
          <Route path="/chat" element={<Navigate to="/lab" replace />} />
          <Route path="/practice" element={<Navigate to="/lab" replace />} />
          <Route path="/video-tutor" element={<Navigate to="/lab" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
