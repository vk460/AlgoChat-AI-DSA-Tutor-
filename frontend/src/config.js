// Intelligent API URL detection
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://algochat-ai-dsa-tutor-1.onrender.com');

export default API_URL;
