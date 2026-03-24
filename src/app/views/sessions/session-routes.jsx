import Loadable from "app/components/Loadable";
import { lazy } from "react";

const NotFound = lazy(() => import("./NotFound"));

const JwtLogin = Loadable(lazy(() => import("./login/JwtLogin")));
const JwtRegister = Loadable(lazy(() => import("./register/JwtRegister")));
const EmailConfirmed = Loadable(lazy(() => import("./EmailConfirmed")));
const ResetPassword = Loadable(lazy(() => import("./ResetPassword")));
const ForgotPassword = Loadable(lazy(() => import("./ForgotPassword")));

const sessionRoutes = [
  { path: "/session/signup", element: <JwtRegister /> },
  { path: "/session/signin", element: <JwtLogin /> },
  { path: "/session/forgot-password", element: <ForgotPassword /> },
  { path: "/session/confirm-email", element: <EmailConfirmed /> },
  { path: "/session/reset-password", element: <ResetPassword /> },
  { path: "*", element: <NotFound /> }
];

export default sessionRoutes;
