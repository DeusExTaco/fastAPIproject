// ResetPassword.tsx
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import PasswordForm from './PasswordForm';
import ErrorBoundary from './errors/ErrorBoundary.tsx';

// Export the component that's being used in AppRoutes
const ResetPasswordHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const isWelcome = searchParams.get('welcome') === 'true';

  const handleSuccess = () => {
    setTimeout(() => {
      navigate('/login?setup=success');
    }, 3000);
  };

  if (!token) {
    console.log('No reset token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {isWelcome && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-700">
                Welcome! Please set up your password to complete your account creation.
              </p>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-lg">
            <PasswordForm
              token={token}
              onSuccess={handleSuccess}
              title={isWelcome ? "Set Up Your Password" : "Reset Password"}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ResetPasswordHandler;