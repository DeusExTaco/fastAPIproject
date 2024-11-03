import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from "@material-tailwind/react";

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
      <ThemeProvider value={themeConfig}>
        <AuthProvider>
          <Router>
            <div className="w-screen h-screen m-0 p-0 overflow-hidden">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;