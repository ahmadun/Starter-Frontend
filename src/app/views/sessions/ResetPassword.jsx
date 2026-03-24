import { useMemo } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";

import { useResetPassword } from "app/hooks/useAccount";
import { Paragraph } from "app/components/Typography";
import AuthLayout from "./components/AuthLayout";

const validationSchema = Yup.object({
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your new password")
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPasswordMutation = useResetPassword();

  const token = searchParams.get("token") || searchParams.get("code") || "";
  const email = searchParams.get("email") || "";
  const userId = searchParams.get("userId") || searchParams.get("user_id") || "";

  const missingToken = useMemo(() => token.trim().length === 0, [token]);

  const handleSubmit = async (values) => {
    await resetPasswordMutation.mutateAsync({
      token,
      code: token,
      email: email || undefined,
      userId: userId || undefined,
      password: values.password,
      newPassword: values.password,
      confirmPassword: values.confirmPassword,
      confirmNewPassword: values.confirmPassword
    });

    navigate("/session/signin", {
      replace: true,
      state: { passwordReset: true }
    });
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Finish the recovery flow by choosing a new password for the account."
      image="/assets/images/illustrations/upgrade.svg"
      imageAlt="Reset password illustration"
      footer={
        <Paragraph color="text.secondary">
          Remembered it?
          <Link component={NavLink} to="/session/signin" sx={{ ml: 0.75 }}>
            Return to sign in
          </Link>
        </Paragraph>
      }
    >
      {missingToken ? (
        <Alert severity="warning">
          This reset link is incomplete. Open the password reset link from your email again.
        </Alert>
      ) : (
        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            isSubmitting,
            handleBlur,
            handleChange,
            handleSubmit: submitForm
          }) => (
            <form onSubmit={submitForm}>
              {email && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Resetting password for <strong>{email}</strong>
                </Alert>
              )}

              <TextField
                fullWidth
                size="small"
                name="password"
                label="New Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.password && errors.password)}
                helperText={touched.password && errors.password}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
                sx={{ mb: 3 }}
              />

              <LoadingButton
                fullWidth
                type="submit"
                variant="contained"
                loading={isSubmitting || resetPasswordMutation.isPending}
                sx={{ py: 1.1 }}
              >
                Reset Password
              </LoadingButton>
            </form>
          )}
        </Formik>
      )}
    </AuthLayout>
  );
}
