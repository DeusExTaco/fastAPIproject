import React, { useState } from 'react';
import {Link} from "react-router-dom";

function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/password-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.detail || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
      <div>
        <h2>Password Recovery</h2>
        <form onSubmit={handleSubmit}>
          <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
          />
          <button type="submit">Send Recovery Email</button>
        </form>
        {message && <p style={{color: 'green'}}>{message}</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div><Link to="/Login">Go to Login</Link></div>
      </div>
  );
}

export default PasswordRecovery;