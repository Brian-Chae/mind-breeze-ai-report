import React from 'react';
import { Toaster } from 'sonner';
import MindBreezeApp from './components/MindBreezeApp';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <MindBreezeApp />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;