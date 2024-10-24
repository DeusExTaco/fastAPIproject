import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
      <div>
          <h1>Welcome to Your App</h1>
          <p>This is the home page.</p>
          <Link to="/login">Go to Login</Link>
      </div>

  );
}

export default Home;






