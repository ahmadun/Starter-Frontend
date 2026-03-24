import { lazy } from "react";
import Loadable from "app/components/Loadable";

const ProjectsPage = Loadable(lazy(() => import("../projects/ProjectsPage")));
const ProjectDetailPage = Loadable(lazy(() => import("../projects/ProjectDetailPage")));
const PrivateTaskBoardPage = Loadable(lazy(() => import("../projects/PrivateTaskBoardPage")));
const MyTasksPage = Loadable(lazy(() => import("../projects/MyTasksPage")));
const UsersPage = Loadable(lazy(() => import("../users/UsersPage")));
const InboxPage = Loadable(lazy(() => import("../notifications/InboxPage")));
const CategoriesPage = Loadable(lazy(() => import("../master/CategoriesPage")));
const ProfilePage = Loadable(lazy(() => import("../account/ProfilePage")));
const ForcePasswordChangePage = Loadable(lazy(() => import("../account/ForcePasswordChangePage")));

// Approval pages
const ApprovalTemplatesPage = Loadable(lazy(() => import("../approval/ApprovalTemplatesPage")));
const ApprovalTemplateFormPage = Loadable(lazy(() => import("../approval/ApprovalTemplateFormPage")));
const ApprovalPendingPage = Loadable(lazy(() => import("../approval/ApprovalPendingPage")));
const ProjectApprovalRequestsPage = Loadable(lazy(() => import("../approval/ProjectApprovalRequestsPage")));
const ApprovalRequestDetailPage = Loadable(lazy(() => import("../approval/ApprovalRequestDetailPage")));
const CreateApprovalRequestPage = Loadable(lazy(() => import("../approval/CreateApprovalRequestPage")));

const materialRoutes = [
  // Existing routes
  { path: "/projects", element: <ProjectsPage /> },
  { path: "/projects/:projectId", element: <ProjectDetailPage /> },
  { path: "/projects/:projectId/tasks/:taskId/private-board", element: <PrivateTaskBoardPage /> },
  { path: "/my-tasks", element: <MyTasksPage /> },
  { path: "/inbox", element: <InboxPage /> },
  { path: "/users", element: <UsersPage /> },
  { path: "/master/categories", element: <CategoriesPage /> },
  { path: "/account/profile", element: <ProfilePage /> },
  { path: "/account/change-password", element: <ForcePasswordChangePage /> },

  { path: "/approvals/templates", element: <ApprovalTemplatesPage /> },
  { path: "/approvals/templates/new", element: <ApprovalTemplateFormPage /> },
  { path: "/approvals/templates/:templateId/edit", element: <ApprovalTemplateFormPage /> },

  { path: "/approvals/pending", element: <ApprovalPendingPage /> },

  { path: "/projects/:projectId/approvals", element: <ProjectApprovalRequestsPage /> },
  { path: "/projects/:projectId/approvals/new", element: <CreateApprovalRequestPage /> },
  { path: "/projects/:projectId/approvals/:requestId", element: <ApprovalRequestDetailPage /> },
];

export default materialRoutes;
