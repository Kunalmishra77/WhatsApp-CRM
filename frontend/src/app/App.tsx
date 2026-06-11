import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppRoutes } from './routes';
import { DiagnosticsPanel } from '../components/Diagnostics/DiagnosticsPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';

function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
          <DiagnosticsPanel />
        </BrowserRouter>
      </ErrorBoundary>
    </Providers>
  );
}

export default App;
