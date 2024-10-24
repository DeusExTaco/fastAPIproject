import React, { useState, useEffect } from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';

interface ValidationError {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: string;
    ctx?: Record<string, any>; // Optional context
}

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [generatedPassword, setGeneratedPassword] = useState<string>(''); // State for generated password


  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('No reset token provided.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset error and message when the user submits
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      // Clear the password fields when there's an error
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (response.ok) {
        setMessage('Password reset successful. You can now login with your new password.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        console.error("Validation Errors:", errorData); // Log the error details
        // Clear the password fields if there's an error from the server
        setNewPassword('');
        setConfirmPassword('');
        // Extract and display the error messages
        if (errorData.detail && Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map((err: ValidationError) => err.msg).join(', '); // Specify type for err
            setError(messages); // Set the error message
        } else {
            setError('Failed to change password'); // Fallback error message
        }
      }
  } catch (error) {
      console.error("Fetch Error:", error); // Log any fetch errors
      setError('An error occurred changing your password. Please try again.'); // General error message
  }
};

  // Function to handle random password generation
  const generateRandomPassword = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length: 16, // You can customize these options as needed
          use_upper: true,
          use_lower: true,
          use_numbers: true,
          use_special: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPassword(data.generated_password); // Set the generated password
        setNewPassword(data.generated_password);
        setConfirmPassword(data.generated_password); // Optionally set it as the new password
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to generate password');
      }
    } catch (error) {
      setError('An error occurred while generating password. Please try again.');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error above the form */}
      {message && <p style={{ color: 'green' }}>{message}</p>} {/* Display success message */}
      {generatedPassword && <p style={{ color: 'white' }}>Generated Password: {generatedPassword}</p>} {/* Display generated password */}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      <div>
        <button type="button" onClick={generateRandomPassword}>Generate Random New Password</button>
      </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}  {/* Display error messages */}
      </form>
    </div>
  );
}

export default ResetPassword;