import { useState } from 'react';

const EnvDebugger = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 9999
        }}
      >
        ENV DEBUG
      </button>
    );
  }

  const envVars = {
    'VITE_OPENAI_API_KEY': import.meta.env.VITE_OPENAI_API_KEY,
    'DEV': import.meta.env.DEV,
    'PROD': import.meta.env.PROD,
    'MODE': import.meta.env.MODE,
    'BASE_URL': import.meta.env.BASE_URL,
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '50px',
      right: '10px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Environment Variables Debug
        <button 
          onClick={() => setShowDebug(false)}
          style={{ float: 'right', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '5px' }}>
          <strong>{key}:</strong>{' '}
          {key === 'VITE_OPENAI_API_KEY' 
            ? (value ? `${value.substring(0, 10)}...` : 'undefined')
            : String(value)
          }
        </div>
      ))}
      
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
        All env keys: {Object.keys(import.meta.env).join(', ')}
      </div>
    </div>
  );
};

export default EnvDebugger;