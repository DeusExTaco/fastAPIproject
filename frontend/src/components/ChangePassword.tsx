import React, { useState } from 'react';

interface ChangePasswordProps {
  userId: number;
  onPasswordChanged: () => void;
}

interface ValidationError {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: string;
    ctx?: Record<string, any>; // Optional context
}


const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState<string>(''); // State for generated password

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Reset error state
    setSuccess(''); // Reset success state

    if (newPassword !== confirmPassword) {
        setError("New passwords don't match");
        setNewPassword('');
        setConfirmPassword('');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });

        if (response.ok) {
            setSuccess('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onPasswordChanged();
        } else {
            const errorData = await response.json(); // Parse the error response
            console.error("Validation Errors:", errorData); // Log the error details
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
    <form onSubmit={handleSubmit}>
      <h3>Change Password</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}  {/* Display error messages */}
      {success && <p style={{ color: 'green' }}>{success}</p>}  {/* Display success messages */}
      {generatedPassword && <p style={{ color: 'white' }}>Generated Password: {generatedPassword}</p>} {/* Display generated password */}

      <div>
        <label htmlFor="currentPassword">Current Password:</label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <label htmlFor="newPassword">New Password:</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
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
          autoComplete="new-password"
        />
      </div>
      <button type="submit">Change Password</button>
      <div>
        <button type="button" onClick={generateRandomPassword}>Generate Random New Password</button>
      </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}  {/* Display error messages */}
    </form>
  );
};

export default ChangePassword;
