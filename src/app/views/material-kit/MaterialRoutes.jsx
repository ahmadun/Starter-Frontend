import { lazy } from "react";
import Loadable from "app/components/Loadable";


const UsersPage = Loadable(lazy(() => import("../users/UsersPage")));
const ProfilePage = Loadable(lazy(() => import("../account/ProfilePage")));
const ForcePasswordChangePage = Loadable(lazy(() => import("../account/ForcePasswordChangePage")));



const materialRoutes = [
  { path: "/users", element: <UsersPage /> },
  { path: "/account/profile", element: <ProfilePage /> },
  { path: "/account/change-password", element: <ForcePasswordChangePage /> },

];

export default materialRoutes;
