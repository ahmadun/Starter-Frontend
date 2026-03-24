import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationPreferences,
  useUpdateNotificationPreference
} from "app/hooks/useNotifications";

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function typeLabel(type) {
  return String(type ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function SummaryCard({ title, value, caption }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          {caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

const preferenceCopy = {
  task_assigned: {
    title: "Assignments",
    caption: "Alert me when I am assigned to work."
  },
  task_comment_added: {
    title: "Comments",
    caption: "Alert me when followed or owned tasks get new comments."
  },
  task_attachment_added: {
    title: "Attachments",
    caption: "Alert me when files are added to followed or owned tasks."
  },
  task_status_changed: {
    title: "Status changes",
    caption: "Alert me when tracked tasks move between statuses."
  },
  task_mentioned: {
    title: "Mentions",
    caption: "Alert me when someone mentions my username in a comment."
  }
};

export default function InboxPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const filters = useMemo(() => {
    if (tab === 1) return { isRead: false, page: 1, pageSize: 50 };
    if (tab === 2) return { isRead: true, page: 1, pageSize: 50 };
    return { page: 1, pageSize: 50 };
  }, [tab]);

  const { data, isLoading, isError, error, isFetching } = useNotifications(filters);
  const { data: preferences = [], isLoading: preferencesLoading } = useNotificationPreferences();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const updatePreferenceMutation = useUpdateNotificationPreference();

  const paged = data ?? null;
  const items = paged?.items ?? [];

  const stats = useMemo(() => {
    const unread = items.filter((item) => !item.isRead).length;
    const read = items.filter((item) => item.isRead).length;
    return {
      total: items.length,
      unread,
      read
    };
  }, [items]);

  const openNotification = async (item) => {
    if (!item.isRead) {
      try {
        await markAsReadMutation.mutateAsync(item.id);
      } catch {
        // snackbar handles error
      }
    }

    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Inbox
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track task activity, approvals, and assignment updates in one place.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadRoundedIcon />}
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || stats.unread === 0}
          >
            {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <SummaryCard title="Visible" value={stats.total} caption="Notifications in the current view" />
          <SummaryCard title="Unread" value={stats.unread} caption="Items still needing your attention" />
          <SummaryCard title="Read" value={stats.read} caption="Already reviewed updates" />
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SettingsSuggestRoundedIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Collaboration Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Choose which collaboration updates should reach your inbox.
                </Typography>
              </Box>
            </Stack>

            {preferencesLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={68} />
                ))}
              </Stack>
            ) : (
              <Stack spacing={1.25}>
                {preferences.map((item) => {
                  const copy = preferenceCopy[item.type] ?? {
                    title: typeLabel(item.type),
                    caption: "Manage whether this notification type reaches your inbox."
                  };

                  return (
                    <Card key={item.type} variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {copy.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {copy.caption}
                            </Typography>
                          </Box>
                          <Switch
                            edge="end"
                            checked={Boolean(item.enabled)}
                            disabled={updatePreferenceMutation.isPending}
                            onChange={(_, checked) => {
                              updatePreferenceMutation.mutate({ type: item.type, enabled: checked });
                            }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="All" />
            <Tab label="Unread" />
            <Tab label="Read" />
          </Tabs>
          <Divider />

          <Box sx={{ p: 2 }}>
            {isLoading ? (
              <Stack spacing={1.5}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={92} />
                ))}
              </Stack>
            ) : isError ? (
              <Alert severity="error">{error?.message ?? "Failed to load notifications."}</Alert>
            ) : items.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <NotificationsNoneRoundedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No notifications found
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>
                  New approvals, assignments, comments, and attachments will appear here.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ opacity: isFetching ? 0.7 : 1, transition: "opacity 0.2s" }}>
                {items.map((item) => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      borderColor: item.isRead ? "divider" : "primary.light",
                      bgcolor: item.isRead ? "background.paper" : "primary.50"
                    }}
                  >
                    <CardActionArea onClick={() => openNotification(item)}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {item.title}
                              </Typography>
                              <Chip
                                label={typeLabel(item.type)}
                                size="small"
                                color={item.isRead ? "default" : "primary"}
                                variant={item.isRead ? "outlined" : "filled"}
                              />
                              {!item.isRead && <Chip label="Unread" size="small" color="warning" />}
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {item.message}
                            </Typography>

                            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1.25 }}>
                              {formatDateTime(item.createdAt)}
                            </Typography>
                          </Box>

                          {item.linkUrl && (
                            <Button
                              size="small"
                              endIcon={<OpenInNewRoundedIcon />}
                              onClick={(event) => {
                                event.stopPropagation();
                                openNotification(item);
                              }}
                            >
                              Open
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
