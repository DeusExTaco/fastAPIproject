import { useState } from 'react';
import { LoginDialog } from '../components/login/LoginDialog';

interface HomeProps {
  initialLoginOpen?: boolean;
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

function Home({ initialLoginOpen = false, onLogin }: Readonly<HomeProps>) {
  const [isLoginOpen, setIsLoginOpen] = useState(initialLoginOpen);

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => setIsLoginOpen(false);

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your App</h1>
        <p className="text-gray-600 mb-6">This is the home page.</p>
        <button
          onClick={handleOpenLogin}
          className="text-indigo-600 font-semibold hover:text-indigo-800 underline transition duration-200"
        >
          Login
        </button>
      </div>

      <LoginDialog
        open={isLoginOpen}
        onClose={handleCloseLogin}
        onLogin={onLogin}
      />
    </div>
  );
}

export default Home;