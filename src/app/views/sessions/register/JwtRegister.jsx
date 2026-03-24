import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";

import useAuth from "app/hooks/useAuth";
import { Paragraph } from "app/components/Typography";
import AuthLayout from "../components/AuthLayout";

const initialValues = {
  email: "",
  username: "",
  password: "",
  confirmPassword: ""
};

const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  username: Yup.string().max(100, "Username is too long").required("Username is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password")
});

export default function JwtRegister() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    navigate(user?.mustChangePassword ? "/account/change-password" : "/", { replace: true });
  }, [isAuthenticated, navigate, user?.mustChangePassword]);

  const handleSubmit = async (values) => {
    setErrorMessage("");

    try {
      await register(
        values.email.trim(),
        values.username.trim(),
        values.password,
        values.confirmPassword
      );
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error.message || "Registration failed.");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Let users sign themselves up, then complete the rest of their profile after sign-in."
      image="/assets/images/icon.svg"
      imageAlt="Project Management"
      footer={
        <Paragraph color="text.secondary">
          Already have an account?
          <Link component={NavLink} to="/session/signin" sx={{ ml: 0.75 }}>
            Sign in
          </Link>
        </Paragraph>
      }
    >
      <Formik
        initialValues={initialValues}
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
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <TextField
              fullWidth
              size="small"
              name="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.email && errors.email)}
              helperText={touched.email && errors.email}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              size="small"
              name="username"
              label="Username"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.username && errors.username)}
              helperText={touched.username && errors.username}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              size="small"
              name="password"
              label="Password"
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
              label="Confirm Password"
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
              loading={isSubmitting}
              sx={{ py: 1.1 }}
            >
              Create Account
            </LoadingButton>
          </form>
        )}
      </Formik>
    </AuthLayout>
  );
}
