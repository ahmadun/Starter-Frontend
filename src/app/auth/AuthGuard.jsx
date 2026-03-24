import useAuth from "app/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

const MUST_CHANGE_PASSWORD_PATH = "/account/change-password";

const AuthGuard = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const location = useLocation();

  if (isAuthenticated && user?.mustChangePassword && location.pathname !== MUST_CHANGE_PASSWORD_PATH) {
    return <Navigate to={MUST_CHANGE_PASSWORD_PATH} state={{ from: location }} replace />;
  }

  if (isAuthenticated) return <>{children}</>;

  return <Navigate to="/session/signin" state={{ from: location }} replace />;
};

export default AuthGuard;
