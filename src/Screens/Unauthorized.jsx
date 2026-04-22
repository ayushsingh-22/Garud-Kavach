import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>403 - Forbidden</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/">Go to Homepage</Link>
    </div>
  );
};

export default Unauthorized;
