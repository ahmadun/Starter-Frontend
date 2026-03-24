import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";

import useAuth from "app/hooks/useAuth";
import { useChangePassword, useMyProfile, useUpdateMyProfile } from "app/hooks/useAccount";

const profileSchema = Yup.object({
  fullName: Yup.string().max(150, "Full name is too long").required("Full name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  phoneNumber: Yup.string().max(50, "Phone number is too long").nullable()
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm the new password")
});

const normalizeProfile = (data, fallbackUser) => ({
  id: data?.userId ?? data?.id ?? fallbackUser?.id,
  username: data?.username ?? fallbackUser?.username ?? "",
  fullName: data?.fullName ?? data?.fullname ?? data?.name ?? fallbackUser?.fullName ?? "",
  email: data?.email ?? fallbackUser?.email ?? "",
  role: data?.role ?? fallbackUser?.role ?? "",
  employeeId: data?.employeeId ?? fallbackUser?.employeeId ?? "",
  phoneNumber: data?.phoneNumber ?? fallbackUser?.phoneNumber ?? "",
  department: data?.department ?? fallbackUser?.department ?? "",
  mustChangePassword: Boolean(data?.mustChangePassword ?? fallbackUser?.mustChangePassword)
});

function ProfileSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={88} />
      <Skeleton variant="rounded" height={280} />
      <Skeleton variant="rounded" height={260} />
    </Stack>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { data, isLoading, isError, error } = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const changePasswordMutation = useChangePassword();

  const profile = useMemo(() => normalizeProfile(data, user), [data, user]);

  const profileFormik = useFormik({
    initialValues: {
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        userId: profile.id,
        username: profile.username,
        fullName: values.fullName.trim(),
        name: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber?.trim() || null
      });

      refreshUser({
        ...profile,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber?.trim() || null
      });
    }
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, helpers) => {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        oldPassword: values.currentPassword,
        password: values.newPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
        confirmNewPassword: values.confirmPassword
      });

      refreshUser({ ...profile, mustChangePassword: false });
      helpers.resetForm();
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <ProfileSkeleton />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error?.message || "Failed to load your profile."}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  My Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  View and update the personal details tied to your project account.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={profile.role || "User"} color="primary" variant="outlined" />
                {profile.mustChangePassword && (
                  <Chip label="Password update required" color="warning" />
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid2 container spacing={3} alignItems="stretch">
          <Grid2 size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, display: "flex", flexDirection: "column", flex: 1 }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Personal Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
                  Keep your contact information current so the system and approvals can identify you correctly.
                </Typography>

                <form
                  onSubmit={profileFormik.handleSubmit}
                  style={{ display: "flex", flexDirection: "column", flex: 1 }}
                >
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <TextField fullWidth label="Username" value={profile.username} disabled />
                    <TextField
                      fullWidth
                      name="fullName"
                      label="Full Name"
                      value={profileFormik.values.fullName}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={Boolean(profileFormik.touched.fullName && profileFormik.errors.fullName)}
                      helperText={profileFormik.touched.fullName && profileFormik.errors.fullName}
                    />
                    <TextField
                      fullWidth
                      name="email"
                      label="Email"
                      type="email"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={Boolean(profileFormik.touched.email && profileFormik.errors.email)}
                      helperText={profileFormik.touched.email && profileFormik.errors.email}
                    />
                    <TextField
                      fullWidth
                      name="phoneNumber"
                      label="Phone Number"
                      value={profileFormik.values.phoneNumber}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={Boolean(profileFormik.touched.phoneNumber && profileFormik.errors.phoneNumber)}
                      helperText={profileFormik.touched.phoneNumber && profileFormik.errors.phoneNumber}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField fullWidth label="Employee ID" value={profile.employeeId || "-"} disabled />
                      <TextField fullWidth label="Department" value={profile.department || "-"} disabled />
                    </Stack>
                    <Box sx={{ mt: "auto", pt: 1 }}>
                      <Button type="submit" variant="contained" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, display: "flex", flexDirection: "column", flex: 1 }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Security
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Change your password at any time, or clear an admin-requested password update.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <form
                  onSubmit={passwordFormik.handleSubmit}
                  style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        type="password"
                        name="currentPassword"
                        label="Current Password"
                        value={passwordFormik.values.currentPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={Boolean(
                          passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                        )}
                        helperText={
                          passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                        }
                      />
                      <TextField
                        fullWidth
                        type="password"
                        name="newPassword"
                        label="New Password"
                        value={passwordFormik.values.newPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={Boolean(passwordFormik.touched.newPassword && passwordFormik.errors.newPassword)}
                        helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                      />
                      <TextField
                        fullWidth
                        type="password"
                        name="confirmPassword"
                        label="Confirm New Password"
                        value={passwordFormik.values.confirmPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={Boolean(
                          passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                        )}
                        helperText={
                          passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                        }
                      />
                    </Stack>
                  </Box>
                  <Box sx={{ pt: 2, mt: "auto" }}>
                    <Button type="submit" variant="contained" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  );
}
