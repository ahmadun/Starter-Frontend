import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  getNotifications,
  getNotificationPreferences,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreference
} from "/src/api/notifications";

export const NOTIFICATION_KEYS = {
  all: ["notifications"],
  list: (params) => ["notifications", params],
  unreadCount: ["notifications", "unread-count"],
  preferences: ["notifications", "preferences"]
};

export const useNotifications = (params = {}, options = {}) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => getNotifications(params).then((r) => r.data),
    staleTime: 15_000,
    ...options
  });

export const useUnreadNotificationCount = (options = {}) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: () => getUnreadNotificationCount().then((r) => r.data),
    staleTime: 10_000,
    refetchInterval: 30_000,
    ...options
  });

export const useNotificationPreferences = (options = {}) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.preferences,
    queryFn: () => getNotificationPreferences().then((r) => r.data),
    staleTime: 30_000,
    ...options
  });

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      enqueueSnackbar(res?.message || "Notification marked as read", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to mark notification as read", { variant: "error" });
    }
  });
};

export const useUpdateNotificationPreference = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ type, enabled }) => updateNotificationPreference(type, { enabled }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      enqueueSnackbar(res?.message || "Notification preference updated", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to update preference", { variant: "error" });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      enqueueSnackbar(res?.message || "All notifications marked as read", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to mark all notifications as read", { variant: "error" });
    }
  });
};
