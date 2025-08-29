// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permite usar como wrapper <ProtectedRoute><Page/></ProtectedRoute>
  return children ? children : <Outlet />;
}
