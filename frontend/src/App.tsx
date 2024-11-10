import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './contexts/ThemeContexts';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/errors/ErrorBoundary.tsx';
import { ThemeProvider as MaterialThemeProvider } from "@material-tailwind/react";

const themeConfig = {
  container: false,
  theme: {
    container: {
      padding: '0',
      margin: '0',
      maxWidth: 'none',
    }
  }
};

function App() {
  console.log('App rendering');

  return (
    <ErrorBoundary>
      <MaterialThemeProvider value={themeConfig}>
        <AuthProvider>
          <ThemeProvider> {/* Add our custom ThemeProvider here */}
            <Router>
              <div className="w-screen h-screen m-0 p-0 overflow-hidden">
                <AppRoutes />
              </div>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </MaterialThemeProvider>
    </ErrorBoundary>
  );
}

export default App;