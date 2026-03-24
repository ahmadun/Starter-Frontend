import { useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Typography
} from "@mui/material";
import styled from "@mui/material/styles/styled";
import Notifications from "@mui/icons-material/Notifications";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { MatxMenu } from "app/components";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount
} from "app/hooks/useNotifications";

const TriggerButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.14)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.22)"
  }
}));

const MenuContent = styled("div")(({ theme }) => ({
  width: 360,
  maxWidth: "calc(100vw - 32px)",
  padding: theme.spacing(0.5, 0)
}));

const NotificationItem = styled(MenuItem)(({ theme }) => ({
  alignItems: "flex-start",
  paddingTop: theme.spacing(1.25),
  paddingBottom: theme.spacing(1.25),
  whiteSpace: "normal",
  borderRadius: theme.shape.borderRadius * 1.5,
  margin: theme.spacing(0, 1),
  "&.MuiMenuItem-root": {
    minHeight: "unset"
  }
}));

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function initialsFor(type) {
  return String(type ?? "N")
    .split("_")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export default function NotificationBar() {
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data, isLoading } = useNotifications({ page: 1, pageSize: 5 });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = unreadData?.unreadCount ?? 0;
  const notifications = data?.items ?? [];

  const summaryText = useMemo(() => {
    if (unreadCount === 0) return "You're all caught up";
    if (unreadCount === 1) return "1 unread update";
    return `${unreadCount} unread updates`;
  }, [unreadCount]);

  const openNotification = async (item) => {
    if (!item.isRead) {
      try {
        await markAsReadMutation.mutateAsync(item.id);
      } catch {
        return;
      }
    }

    navigate(item.linkUrl || "/inbox");
  };

  return (
    <MatxMenu
      horizontalPosition="right"
      shouldCloseOnItemClick={false}
      menuButton={
        <TriggerButton aria-label="Notifications">
          <Badge
            color="secondary"
            badgeContent={unreadCount > 99 ? "99+" : unreadCount}
            invisible={unreadCount === 0}
            overlap="circular"

          >
            <Notifications sx={{ color: "text.primary" }} />
          </Badge>
        </TriggerButton>
      }
    >
      <MenuContent>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {summaryText}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<MarkEmailReadRoundedIcon />}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Read all
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ py: 0.75 }}>
          {isLoading ? (
            <Stack spacing={1} sx={{ px: 2, py: 1 }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : notifications.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications yet.
              </Typography>
            </Box>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.id}
                onClick={() => openNotification(item)}
                sx={{
                  bgcolor: item.isRead ? "transparent" : "primary.50"
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: 12,
                      bgcolor: item.isRead ? "grey.300" : "primary.main",
                      color: item.isRead ? "text.primary" : "common.white"
                    }}
                  >
                    {initialsFor(item.type)}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                      <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35 }}>
                        {item.title}
                      </Typography>
                      {!item.isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            mt: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mt: 0.35
                      }}
                    >
                      {item.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
                      {formatDateTime(item.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </NotificationItem>
            ))
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 1.25 }}>
          <Button
            component={RouterLink}
            to="/inbox"
            fullWidth
            variant="outlined"
            endIcon={<OpenInNewRoundedIcon />}
          >
            View all notifications
          </Button>
        </Box>
      </MenuContent>
    </MatxMenu>
  );
}
