import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import apiFetch from "../utils/apiFetch";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      try {
        const response = await apiFetch("/api/check-login", { method: "GET" });
        if (mounted) {
          setIsAuthenticated(response.ok);
        }
      } catch (_error) {
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        <div>Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
