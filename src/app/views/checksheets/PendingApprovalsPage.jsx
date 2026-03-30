import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useNavigate } from "react-router-dom";
import { usePendingApprovalRequests, useRespondApprovalRequest } from "app/hooks/useChecksheets";

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = usePendingApprovalRequests();
  const respondMutation = useRespondApprovalRequest();
  const [target, setTarget] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [comment, setComment] = useState("");
  const items = data?.data ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Pending My Approval</Typography>
          <Typography variant="body2" color="text.secondary">
            Review month-end checksheet submissions assigned to your current approval step.
          </Typography>
        </Box>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Typography color="text.secondary">Loading pending approvals...</Typography>
          </Paper>
        ) : isError ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Checksheet</TableCell>
                  <TableCell>Request</TableCell>
                  <TableCell>Step</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.requestId}-${item.stepId}`} hover>
                    <TableCell>{item.checksheetTitle}</TableCell>
                    <TableCell>{item.requestTitle}</TableCell>
                    <TableCell>{item.stepName}</TableCell>
                    <TableCell>{item.approvalMode}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button onClick={() => navigate(`/checksheets/submissions/${item.checksheetSubmissionId}`)}>Open</Button>
                        <Button variant="contained" onClick={() => setTarget(item)}>Respond</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      No approvals pending your action.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={!!target} onClose={respondMutation.isPending ? undefined : () => setTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Respond Approval</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField select label="Decision" value={decision} onChange={(event) => setDecision(event.target.value)}>
              <MenuItem value="approved">Approve</MenuItem>
              <MenuItem value="rejected">Reject</MenuItem>
            </TextField>
            <TextField label="Comment" value={comment} onChange={(event) => setComment(event.target.value)} multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)} disabled={respondMutation.isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              respondMutation.mutate(
                {
                  requestId: target.requestId,
                  stepId: target.stepId,
                  data: { decision, comment: comment.trim() || null }
                },
                {
                  onSuccess: () => {
                    setTarget(null);
                    setDecision("approved");
                    setComment("");
                  }
                }
              )
            }
            disabled={respondMutation.isPending}
          >
            {respondMutation.isPending ? "Saving..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
