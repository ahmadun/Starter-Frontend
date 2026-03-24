import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  changePassword,
  forgotPassword,
  getMyProfile,
  resetPassword,
  updateMyProfile
} from "/src/api/account";

export const ACCOUNT_KEYS = {
  profile: ["account", "profile"]
};

export const useMyProfile = (options = {}) =>
  useQuery({
    queryKey: ACCOUNT_KEYS.profile,
    queryFn: () => getMyProfile().then((response) => response.data ?? response),
    staleTime: 30_000,
    ...options
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.profile });
      enqueueSnackbar(response?.message || "Profile updated successfully", { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to update profile", { variant: "error" });
    }
  });
};

export const useForgotPassword = () => {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      enqueueSnackbar(response?.message || "Password reset instructions sent", {
        variant: "success"
      });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to submit forgot password request", {
        variant: "error"
      });
    }
  });
};

export const useResetPassword = () => {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      enqueueSnackbar(response?.message || "Password reset successfully", {
        variant: "success"
      });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to reset password", { variant: "error" });
    }
  });
};

export const useChangePassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.profile });
      enqueueSnackbar(response?.message || "Password changed successfully", {
        variant: "success"
      });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to change password", { variant: "error" });
    }
  });
};
