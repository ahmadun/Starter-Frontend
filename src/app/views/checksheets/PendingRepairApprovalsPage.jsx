import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useApproveRepairRecord, usePendingRepairRecords } from "app/hooks/useChecksheets";

export default function PendingRepairApprovalsPage() {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, error } = usePendingRepairRecords();
  const approveMutation = useApproveRepairRecord();
  const [target, setTarget] = useState(null);

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Pending Repair Approvals</Typography>
          <Typography variant="body2" color="text.secondary">
            Review repair records that are not fully approved across ASSY, QA, and MTA coordinator levels.
          </Typography>
        </Box>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Typography color="text.secondary">Loading pending repair approvals...</Typography>
          </Paper>
        ) : isError ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Machine</TableCell>
                  <TableCell>Repair</TableCell>
                  <TableCell>Current Approval</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={`${item.submissionId}-${item.repairRecordId}`} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{item.machineCode}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.location} | {item.lineName} | {item.inspectionDate} Shift {item.shift}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{item.damageDescription}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.repairDescription}</Typography>
                    </TableCell>
                    <TableCell>{item.nextPendingLevel?.toUpperCase?.() || "Completed"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">Repaired: {item.repairedByName || "-"}</Typography>
                      <Typography variant="body2">ASSY: {item.checkedByAssyName || "-"}</Typography>
                      <Typography variant="body2">QA: {item.checkedByQaName || "-"}</Typography>
                      <Typography variant="body2">MTA: {item.checkedByCoordinatorName || "-"}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button onClick={() => navigate(`/checksheets/submissions/${item.submissionId}`)}>Open</Button>
                        <Button variant="contained" onClick={() => setTarget(item)}>Approve</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      No pending repair approvals.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={!!target} onClose={approveMutation.isPending ? undefined : () => setTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Approve Repair Record</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>
              Approve level <strong>{target?.nextPendingLevel?.toUpperCase?.() || "-"}</strong> for this repair record?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {target?.damageDescription}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)} disabled={approveMutation.isPending}>Cancel</Button>
          <Button
            variant="contained"
            disabled={approveMutation.isPending || !target}
            onClick={() => approveMutation.mutate(
              { submissionId: target.submissionId, recordId: target.repairRecordId },
              { onSuccess: () => setTarget(null) }
            )}
          >
            {approveMutation.isPending ? "Saving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
