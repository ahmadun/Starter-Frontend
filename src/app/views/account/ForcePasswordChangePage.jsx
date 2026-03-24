import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import useAuth from "app/hooks/useAuth";
import { useChangePassword } from "app/hooks/useAccount";

const validationSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password")
});

export default function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { logout, refreshUser, user } = useAuth();
  const changePasswordMutation = useChangePassword();

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    validationSchema,
    onSubmit: async (values) => {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        oldPassword: values.currentPassword,
        password: values.newPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
        confirmNewPassword: values.confirmPassword
      });

      refreshUser({ ...user, mustChangePassword: false });
      navigate("/", { replace: true });
    }
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#EEF2F8",
        p: 3
      }}
    >
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 560, p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          Change your password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          An administrator marked your account to require a password change before continuing.
        </Typography>

        <Alert severity="info" sx={{ mt: 3 }}>
          Signed in as <strong>{user?.username}</strong>
        </Alert>

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              type="password"
              name="currentPassword"
              label="Current Password"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.currentPassword && formik.errors.currentPassword)}
              helperText={formik.touched.currentPassword && formik.errors.currentPassword}
            />

            <TextField
              fullWidth
              type="password"
              name="newPassword"
              label="New Password"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
              helperText={formik.touched.newPassword && formik.errors.newPassword}
            />

            <TextField
              fullWidth
              type="password"
              name="confirmPassword"
              label="Confirm New Password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
            <Button color="inherit" onClick={logout} disabled={changePasswordMutation.isPending}>
              Sign out
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
