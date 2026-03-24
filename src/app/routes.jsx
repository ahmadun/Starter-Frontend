import { lazy } from "react";
import { Navigate } from "react-router-dom";

import AuthGuard from "./auth/AuthGuard";
import { authRoles } from "./auth/authRoles";

import Loadable from "./components/Loadable";
import MatxLayout from "./components/MatxLayout/MatxLayout";
import sessionRoutes from "./views/sessions/session-routes";
import materialRoutes from "app/views/material-kit/MaterialRoutes";

const Analytics = Loadable(lazy(() => import("app/views/dashboard/Analytics")));
const Portfolio = Loadable(lazy(() => import("app/views/dashboard/Portfolio")));
const ResourcePlanning = Loadable(lazy(() => import("app/views/dashboard/ResourcePlanning")));
const Trends = Loadable(lazy(() => import("app/views/dashboard/Trends")));

const routes = [
  { path: "/", element: <Navigate to="dashboard/default" /> },
  {
    element: (
      <AuthGuard>
        <MatxLayout />
      </AuthGuard>
    ),
    children: [
      ...materialRoutes,
      { path: "/dashboard/overview", element: <Analytics />, auth: authRoles.admin },
      { path: "/dashboard/portfolio", element: <Portfolio />, auth: authRoles.admin },
      { path: "/dashboard/resource-planning", element: <ResourcePlanning />, auth: authRoles.admin },
      { path: "/dashboard/default", element: <Trends />, auth: authRoles.admin }
    ]
  },

  ...sessionRoutes
];

export default routes;
