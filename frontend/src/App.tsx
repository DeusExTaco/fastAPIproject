
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from "@material-tailwind/react";

function App() {
  console.log('App rendering');

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; // Ensure this line appears only once
