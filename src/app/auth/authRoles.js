export const authRoles = {
  sa: ["SA", "SuperAdmin"],
  admin: ["SA", "ADMIN", "SuperAdmin", "Admin"],
  editor: ["SA", "ADMIN", "EDITOR", "SuperAdmin", "Admin", "Manager"],
  guest: ["SA", "ADMIN", "EDITOR", "GUEST", "SuperAdmin", "Admin", "Manager", "Employee"]
};
