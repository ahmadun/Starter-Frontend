import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@mui/material/Icon";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Chip,
  ClickAwayListener,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  alpha,
  styled
} from "@mui/material";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardCommandKeyRoundedIcon from "@mui/icons-material/KeyboardCommandKeyRounded";
import { useDebounce } from "use-debounce";
import useAuth from "app/hooks/useAuth";
import { useGlobalSearch } from "app/hooks/useGlobalSearch";
import { topBarHeight } from "app/utils/constant";

const SearchRoot = styled("div")({
  position: "relative"
});

const SearchContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 1200,
  width: "min(920px, calc(100vw - 24px))",
  display: "flex",
  alignItems: "center",
  height: topBarHeight,
  minHeight: topBarHeight,
  paddingInline: 12,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  [theme.breakpoints.down("md")]: {
    width: "calc(100vw - 24px)"
  }
}));

const SearchInput = styled("input")(({ theme }) => ({
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: "1rem",
  paddingLeft: "20px",
  height: "calc(100% - 5px)",
  background: "transparent",
  color: theme.palette.primary.contrastText,
  "&::placeholder": {
    color: alpha(theme.palette.primary.contrastText, 0.8)
  }
}));

const SearchOverlay = styled("div")(({ theme }) => ({
  position: "absolute",
  top: `calc(${topBarHeight}px - 4px)`,
  left: 0,
  width: "min(920px, calc(100vw - 24px))",
  zIndex: 1201,
  [theme.breakpoints.down("md")]: {
    width: "calc(100vw - 24px)"
  }
}));

const SearchPanel = styled(Card)(({ theme }) => ({
  borderRadius: "0 0 24px 24px",
  overflow: "hidden",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  boxShadow: theme.shadows[16]
}));

const SearchResults = styled("div")(({ theme }) => ({
  maxHeight: "min(72vh, 720px)",
  overflowY: "auto",
  padding: 12,
  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${theme.palette.background.paper} 34%)`
}));

const SearchSectionCard = styled(Card)(({ theme }) => ({
  borderRadius: 18,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  overflow: "hidden"
}));

const SearchSectionHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  backgroundColor: alpha(theme.palette.primary.main, 0.05)
}));

const typeMeta = {
  projects: {
    title: "Projects",
    icon: <FolderOpenRoundedIcon fontSize="small" />,
    color: "primary"
  },
  tasks: {
    title: "Tasks",
    icon: <TaskAltRoundedIcon fontSize="small" />,
    color: "success"
  },
  approvalRequests: {
    title: "Approvals",
    icon: <VerifiedRoundedIcon fontSize="small" />,
    color: "warning"
  },
  users: {
    title: "People",
    icon: <PersonRoundedIcon fontSize="small" />,
    color: "info"
  },
  comments: {
    title: "Comments",
    icon: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
    color: "secondary"
  }
};

function resultGroups(data, authUser) {
  const canOpenUsers = ["SuperAdmin", "Admin", "Manager"].includes(authUser?.role);

  return [
    {
      key: "projects",
      items: (data?.projects ?? []).map((item) => ({
        id: `project-${item.id}`,
        primary: item.name,
        secondary: item.description || "Project",
        tertiary: `${item.status}${item.isPrivate ? " • Private" : ""}`,
        path: `/projects/${item.id}`
      }))
    },
    {
      key: "tasks",
      items: (data?.tasks ?? []).map((item) => ({
        id: `task-${item.id}`,
        primary: item.name,
        secondary: item.description || item.projectName,
        tertiary: `${item.projectName} • ${item.status}`,
        path: `/projects/${item.projectId}`
      }))
    },
    {
      key: "approvalRequests",
      items: (data?.approvalRequests ?? []).map((item) => ({
        id: `approval-${item.id}`,
        primary: item.title,
        secondary: item.templateName || item.projectName,
        tertiary: `${item.projectName} • ${item.status}`,
        path: `/projects/${item.projectId}/approvals/${item.id}`
      }))
    },
    {
      key: "users",
      items: (data?.users ?? []).map((item) => ({
        id: `user-${item.userId}`,
        primary: item.username,
        secondary: item.email,
        tertiary: canOpenUsers ? "Open users management" : "Visible from shared project access",
        path: canOpenUsers ? "/users" : null
      }))
    },
    {
      key: "comments",
      items: (data?.comments ?? []).map((item) => ({
        id: `comment-${item.id}`,
        primary: item.taskName,
        secondary: item.snippet,
        tertiary: `${item.projectName} • ${item.createdByUsername}`,
        path: `/projects/${item.projectId}`
      }))
    }
  ].filter((group) => group.items.length > 0);
}

export default function MatxSearchBox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);

  const { data, isFetching, isLoading, isError, error } = useGlobalSearch(
    { query: debouncedQuery.trim(), limitPerType: 5 },
    { enabled: open && debouncedQuery.trim().length >= 2 }
  );

  const groups = useMemo(() => resultGroups(data, user), [data, user]);
  const totalCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSearch = () => {
    setOpen(false);
    setQuery("");
  };

  const openResult = (path) => {
    if (path) navigate(path);
    closeSearch();
  };

  return (
    <ClickAwayListener onClickAway={() => open && closeSearch()}>
      <SearchRoot
        sx={{
          width: { xs: 40, md: "min(920px, calc(100vw - 24px))" },
          height: topBarHeight,
          display: "flex",
          alignItems: "center",
          flexShrink: 0
        }}
      >
        {!open && (
          <IconButton onClick={() => setOpen(true)} sx={{ ml: 0.5, mt: 0.5 }}>
            <Icon sx={{ color: "text.primary" }}>search</Icon>
          </IconButton>
        )}

        {open && (
          <Fragment>
            <SearchContainer sx={{ mt: 0.3 }}>
              <Icon sx={{ color: "inherit" }}>search</Icon>
              <SearchInput
                type="text"
                placeholder="Search here..."
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Chip
                icon={<KeyboardCommandKeyRoundedIcon sx={{ fontSize: 14 }} />}
                label="K"
                size="small"
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  mr: 1,
                  color: "inherit",
                  bgcolor: alpha("#fff", 0.12),
                  "& .MuiChip-icon": { color: "inherit" }
                }}
              />
              <IconButton onClick={closeSearch} sx={{ mx: 1, verticalAlign: "middle", color: "inherit" }}>
                <Icon>close</Icon>
              </IconButton>
            </SearchContainer>

            <SearchOverlay>
              <SearchPanel>
                <SearchResults>
                  {query.trim().length < 2 ? (
                    <Box sx={{ py: 5, px: 2, textAlign: "center" }}>
                      <Typography variant="h6" fontWeight={700}>
                        Search across your workspace
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Start typing at least 2 characters to search projects, tasks, approvals, users, and comments.
                      </Typography>
                    </Box>
                  ) : isLoading || isFetching ? (
                    <Stack spacing={1.5}>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} variant="rounded" height={102} />
                      ))}
                    </Stack>
                  ) : isError ? (
                    <Alert severity="error">{error?.message ?? "Failed to search."}</Alert>
                  ) : totalCount === 0 ? (
                    <Box sx={{ py: 5, px: 2, textAlign: "center" }}>
                      <Typography variant="h6" fontWeight={700}>
                        No results for "{debouncedQuery.trim()}"
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Try a project name, task title, username, approval title, or a comment keyword.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {groups.map((group) => {
                        const meta = typeMeta[group.key];
                        return (
                          <SearchSectionCard key={group.key} variant="outlined">
                            <SearchSectionHeader>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  icon={meta.icon}
                                  label={meta.title}
                                  size="small"
                                  color={meta.color}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {group.items.length} result{group.items.length === 1 ? "" : "s"}
                                </Typography>
                              </Stack>
                            </SearchSectionHeader>

                            <Stack divider={<Divider flexItem />}>
                              {group.items.map((item) => (
                                <CardActionArea
                                  key={item.id}
                                  onClick={() => openResult(item.path)}
                                  disabled={!item.path}
                                >
                                  <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      {item.primary}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        mt: 0.4,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical"
                                      }}
                                    >
                                      {item.secondary}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.8 }}>
                                      {item.tertiary}
                                    </Typography>
                                  </Box>
                                </CardActionArea>
                              ))}
                            </Stack>
                          </SearchSectionCard>
                        );
                      })}
                    </Stack>
                  )}
                </SearchResults>
              </SearchPanel>
            </SearchOverlay>
          </Fragment>
        )}
      </SearchRoot>
    </ClickAwayListener>
  );
}
