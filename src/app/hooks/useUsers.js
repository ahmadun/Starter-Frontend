import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  createUser,
  deleteUser,
  getUser,
  getUserOptions,
  getUsers,
  resetUserPassword,
  updateUser
} from "/src/api/users";

export const USER_KEYS = {
  all: ["users"],
  list: (params) => ["users", params],
  options: (params) => ["users", "options", params],
  detail: (id) => ["users", id]
};

export const useUsers = (params = {}, options = {}) =>
  useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => getUsers(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
    ...options
  });

export const useUser = (id, options = {}) =>
  useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => getUser(id).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    ...options
  });

export const useUserOptions = (params = {}, options = {}) =>
  useQuery({
    queryKey: USER_KEYS.options(params),
    queryFn: () => getUserOptions(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
    ...options
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      enqueueSnackbar(res?.message || "User created successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to create user", { variant: "error" });
    }
  });
};

export const useUpdateUser = (id) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data) => updateUser(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
      enqueueSnackbar(res?.message || "User updated successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to update user", { variant: "error" });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      enqueueSnackbar(res?.message || "User deleted successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to delete user", { variant: "error" });
    }
  });
};

export const useResetUserPassword = (id) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data) => resetUserPassword(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
      enqueueSnackbar(res?.message || "Password reset successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to reset password", { variant: "error" });
    }
  });
};

