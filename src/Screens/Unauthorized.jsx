import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="text-center mt-12 px-4">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">403 - Forbidden</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">You do not have permission to access this page.</p>
      <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">Go to Homepage</Link>
    </div>
  );
};

export default Unauthorized;
