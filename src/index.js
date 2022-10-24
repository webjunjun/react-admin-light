import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/reset.css';
import App from './pages/home/home';
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals();
