import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import useAuth from "app/hooks/useAuth";
import { useCreateApprovalTemplate, useApprovalTemplates } from "app/hooks/useChecksheets";
import { useUsers } from "app/hooks/useUsers";

function CreateApprovalTemplateDialog({ open, onClose }) {
  const createMutation = useCreateApprovalTemplate();
  const { data: usersPage } = useUsers ? useUsers({ Page: 1, PageSize: 100 }) : { data: null };
  const users = usersPage?.items ?? usersPage ?? [];
  const [form, setForm] = useState({
    name: "",
    description: "",
    steps: [{ stepName: "Leader Assy", stepOrder: 1, approvalMode: "any_one", approverUserIds: [] }]
  });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || null,
      steps: form.steps.map((step, index) => ({
        ...step,
        stepOrder: index + 1,
        approverUserIds: step.approverUserIds.map(Number)
      }))
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={createMutation.isPending ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Create Approval Template</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Template Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextField label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} multiline minRows={2} />
          {form.steps.map((step, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                <TextField
                  label="Step Name"
                  value={step.stepName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      steps: current.steps.map((item, itemIndex) => (itemIndex === index ? { ...item, stepName: event.target.value } : item))
                    }))
                  }
                  fullWidth
                />
                <TextField
                  select
                  label="Mode"
                  value={step.approvalMode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      steps: current.steps.map((item, itemIndex) => (itemIndex === index ? { ...item, approvalMode: event.target.value } : item))
                    }))
                  }
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="any_one">Any One</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Approvers"
                  SelectProps={{ multiple: true }}
                  value={step.approverUserIds}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      steps: current.steps.map((item, itemIndex) => (itemIndex === index ? { ...item, approverUserIds: event.target.value } : item))
                    }))
                  }
                  fullWidth
                >
                  {users.map((user) => (
                    <MenuItem key={user.userId} value={user.userId}>
                      {user.username}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  color="error"
                  disabled={form.steps.length <= 1}
                  onClick={() => setForm((current) => ({ ...current, steps: current.steps.filter((_, itemIndex) => itemIndex !== index) }))}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setForm((current) => ({
                ...current,
                steps: [...current.steps, { stepName: "", stepOrder: current.steps.length + 1, approvalMode: "any_one", approverUserIds: [] }]
              }))
            }
          >
            Add Step
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={createMutation.isPending || !form.name.trim()}>
          {createMutation.isPending ? "Saving..." : "Create Template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ApprovalTemplatesPage() {
  const { user } = useAuth();
  const canManage = ["SuperAdmin", "Admin"].includes(user?.role);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, error } = useApprovalTemplates({ page: 1, pageSize: 100, isActive: true });
  const templates = data?.items ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Approval Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure the month-end approval steps used when operators submit checksheets.
            </Typography>
          </Box>
          {canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Approval Template
            </Button>
          )}
        </Stack>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Typography color="text.secondary">Loading approval templates...</Typography>
          </Paper>
        ) : isError ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Steps</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.description || "No description"}
                      </Typography>
                    </TableCell>
                    <TableCell>{template.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{template.stepCount}</TableCell>
                    <TableCell>{new Date(template.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      No approval templates yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {canManage && <CreateApprovalTemplateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />}
    </Box>
  );
}
