
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  console.log('App rendering');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;