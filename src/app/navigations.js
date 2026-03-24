const navigations = [
  {
    name: "Dashboard",
    icon: "dashboard",
    children: [
      {
        name: "Trends",
        iconText: "TR",
        path: "/dashboard/default"
      },
      {
        name: "Overview",
        iconText: "OV",
        path: "/dashboard/overview"
      },
      {
        name: "Portfolio",
        iconText: "PF",
        path: "/dashboard/portfolio"
      },
      {
        name: "Resources",
        iconText: "RP",
        path: "/dashboard/resource-planning"
      }
    ]
  },
  {
    name: "Project Management",
    icon: "account_tree",
    children: [
      {
        name: "All Projects",
        iconText: "AP",
        path: "/projects"
      },
      {
        name: "My Tasks",
        iconText: "MT",
        path: "/my-tasks"
      }
    ]
  },
  {
    name: "Approvals",
    icon: "verified",
    children: [
      {
        name: "Pending My Action",
        iconText: "PA",
        path: "/approvals/pending"
      },
      {
        name: "Approval Templates",
        iconText: "AT",
        path: "/approvals/templates"
      }
    ]
  },
  {
    name: "Master Management",
    icon: "group",
    children: [
      {
        name: "User",
        iconText: "AP",
        path: "/users"
      },
      {
        name: "Category",
        iconText: "CT",
        path: "/master/categories"
      }
    ]
  }
];

export default navigations;
