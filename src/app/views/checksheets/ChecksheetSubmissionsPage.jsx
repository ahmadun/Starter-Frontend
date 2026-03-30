import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import { ConfirmationDialog } from "app/components";
import {
  useChecksheetAreas,
  useChecksheetLines,
  useChecksheetMasters,
  useChecksheetGroups,
  useChecksheetMachines,
  useChecksheetSubmissions,
  useCreateChecksheetSubmission,
  useDeleteChecksheetSubmission
} from "app/hooks/useChecksheets";

const SHIFT_OPTIONS = ["1", "2", "3"];

function formatSubmissionStatus(status) {
  return typeof status === "string" ? status.toUpperCase() : "-";
}

function CreateSubmissionDialog({ open, onClose }) {
  const machinesQuery = useChecksheetMachines({ page: 1, pageSize: 100 }, { enabled: open });
  const groupsQuery = useChecksheetGroups({ enabled: open });
  const createMutation = useCreateChecksheetSubmission();
  const [form, setForm] = useState({
    machineCode: "",
    checksheetMode: "",
    inspectionDate: new Date().toISOString().slice(0, 10),
    shift: "1",
    groupCode: ""
  });

  const machines = machinesQuery.data?.items ?? [];
  const selectedMachine = machines.find((item) => item.machineCode === form.machineCode);
  const groupOptions = useMemo(() => {
    const allGroups = groupsQuery.data ?? [];
    const allowedGroupCodes = new Set(selectedMachine?.groupCodes ?? []);
    return allGroups.filter((group) => allowedGroupCodes.has(group.groupCode));
  }, [groupsQuery.data, selectedMachine?.groupCodes]);

  const isSingleGroupMachine = groupOptions.length === 1;

  useEffect(() => {
    const allowedGroupCodes = new Set(groupOptions.map((group) => group.groupCode));
    setForm((current) => {
      const nextGroupCode = allowedGroupCodes.has(current.groupCode) ? current.groupCode : "";
      if (nextGroupCode === current.groupCode) {
        return current;
      }

      return {
        ...current,
        groupCode: nextGroupCode
      };
    });
  }, [groupOptions]);

  const handleMachineChange = (machineCode) => {
    const machine = machines.find((item) => item.machineCode === machineCode);
    const nextGroupCode = machine?.groupCodes?.length === 1 ? machine.groupCodes[0] : "";
    setForm((current) => ({
      ...current,
      machineCode,
      checksheetMode: machine?.modes?.[0] ?? "",
      groupCode: nextGroupCode
    }));
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    onClose();
  };

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      ...form,
      groupCodes: form.groupCode ? [form.groupCode] : []
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Checksheet Transaction</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            label="Machine Code"
            value={form.machineCode}
            onChange={(event) => handleMachineChange(event.target.value)}
          >
            {machines.map((machine) => (
              <MenuItem key={machine.machineCode} value={machine.machineCode}>
                {machine.machineCode}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Mode"
            value={form.checksheetMode}
            onChange={(event) => setForm((current) => ({ ...current, checksheetMode: event.target.value }))}
            disabled={!selectedMachine}
          >
            {(selectedMachine?.modes ?? []).map((mode) => (
              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Inspection Date"
              type="date"
              value={form.inspectionDate}
              onChange={(event) => setForm((current) => ({ ...current, inspectionDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Shift"
              value={form.shift}
              onChange={(event) => setForm((current) => ({ ...current, shift: event.target.value }))}
              fullWidth
            >
              {SHIFT_OPTIONS.map((shift) => (
                <MenuItem key={shift} value={shift}>Shift {shift}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            select
            label="Group"
            value={form.groupCode}
            onChange={(event) => setForm((current) => ({ ...current, groupCode: event.target.value }))}
            disabled={!selectedMachine || groupOptions.length === 0}
            helperText={
              !selectedMachine
                ? "Select machine first."
                : groupOptions.length === 0
                  ? "This machine has no assigned groups yet."
                  : isSingleGroupMachine
                    ? "This machine is assigned to one group."
                    : "Select one group from the groups assigned to this machine."
            }
          >
            {groupOptions.map((group) => (
              <MenuItem key={group.groupCode} value={group.groupCode}>
                {group.groupCode}
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Location / Plant" value={selectedMachine?.location ?? ""} disabled />
          <TextField label="Line" value={selectedMachine?.lineName ?? ""} disabled />
          <TextField
            label="Template"
            value={selectedMachine
              ? (selectedMachine.modeTemplates?.find((item) => item.checksheetMode === form.checksheetMode)?.templateName ?? "")
              : ""}
            disabled
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createMutation.isPending}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isPending || !form.machineCode || !form.checksheetMode || !form.inspectionDate || !form.shift || !form.groupCode}
        >
          {createMutation.isPending ? "Saving..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ChecksheetSubmissionsPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    checksheetMasterId: "",
    lineCode: "",
    location: ""
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: checksheetMasters = [] } = useChecksheetMasters();
  const { data: lines = [] } = useChecksheetLines();
  const { data: areas = [] } = useChecksheetAreas();
  const { data, isLoading, isError, error } = useChecksheetSubmissions({
    page,
    pageSize,
    checksheetMasterId: filters.checksheetMasterId || undefined,
    lineCode: filters.lineCode || undefined,
    location: filters.location || undefined
  });
  const deleteSubmissionMutation = useDeleteChecksheetSubmission();
  const submissions = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;

  useEffect(() => {
    setPage(1);
  }, [filters.checksheetMasterId, filters.lineCode, filters.location]);

  const stats = useMemo(
    () => ({
      total: totalCount,
      drafts: submissions.filter((item) => item.status === "draft").length,
      submitted: submissions.filter((item) => item.status === "submitted").length,
      approved: submissions.filter((item) => item.status === "approved").length
    }),
    [submissions, totalCount]
  );

  const columns = useMemo(
    () => [
      {
        id: "machine",
        header: "Machine",
        cell: ({ row }) => (
          <>
            <Typography fontWeight={600}>{row.original.machineCode}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.location} | {row.original.lineName}
            </Typography>
          </>
        )
      },
      {
        accessorKey: "inspectionDate",
        header: "Date"
      },
      {
        accessorKey: "shift",
        header: "Shift",
        cell: ({ getValue }) => `Shift ${getValue()}`
      },
      {
        id: "groupCodes",
        header: "Group",
        cell: ({ row }) => (row.original.groupCodes.length > 0 ? row.original.groupCodes.join(", ") : "-")
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Chip
              label={formatSubmissionStatus(status)}
              size="small"
              color={status === "approved" ? "success" : status === "submitted" ? "warning" : status === "rejected" ? "error" : "default"}
            />
          );
        }
      },
      {
        id: "action",
        header: () => <Box sx={{ textAlign: "right" }}>Action</Box>,
        cell: ({ row }) => (
          <Box sx={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 1 }}>
            {row.original.status === "draft" && (
              <Tooltip title="Delete DRAFT transaction">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => setDeleteTarget({
                    id: row.original.id,
                    machineCode: row.original.machineCode,
                    inspectionDate: row.original.inspectionDate
                  })}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Button endIcon={<LaunchIcon />} onClick={() => navigate(`/checksheets/submissions/${row.original.id}`)}>
              Open
            </Button>
          </Box>
        )
      }
    ],
    [navigate]
  );

  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Checksheet Transactions</Typography>
            <Typography variant="body2" color="text.secondary">
              Start inspection from checksheet line master. Board number, line, location, and template are derived automatically.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Checksheet
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Chip label={`${stats.total} Total`} variant="outlined" />
          <Chip label={`${stats.drafts} DRAFT`} color="default" variant="outlined" />
          <Chip label={`${stats.submitted} Submitted`} color="warning" variant="outlined" />
          <Chip label={`${stats.approved} Approved`} color="success" variant="outlined" />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Checksheet Master"
            value={filters.checksheetMasterId}
            onChange={(event) => setFilters((current) => ({ ...current, checksheetMasterId: event.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            {checksheetMasters.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.processCode} - {item.processName} - {item.checksheetName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Line"
            value={filters.lineCode}
            onChange={(event) => setFilters((current) => ({ ...current, lineCode: event.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            {lines.map((line) => (
              <MenuItem key={line.lineCode} value={line.lineCode}>
                {line.lineCode} - {line.lineName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Location"
            value={filters.location}
            onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.areaCode} value={area.areaCode}>
                {area.areaCode} - {area.areaName}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4 }}>
            <Typography color="text.secondary">Loading checksheets...</Typography>
          </Paper>
        ) : isError ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const isFirstColumn = index === 0;
                      const isLastColumn = index === headerGroup.headers.length - 1;

                      return (
                        <TableCell
                          key={header.id}
                          align={isLastColumn ? "right" : "left"}
                          sx={{
                            pl: isFirstColumn ? 3 : 2,
                            pr: isLastColumn ? 3 : 2
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} hover>
                    {row.getVisibleCells().map((cell, index) => {
                      const isFirstColumn = index === 0;
                      const isLastColumn = index === row.getVisibleCells().length - 1;

                      return (
                        <TableCell
                          key={cell.id}
                          align={isLastColumn ? "right" : "left"}
                          sx={{
                            pl: isFirstColumn ? 3 : 2,
                            pr: isLastColumn ? 3 : 2
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {submissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, px: 3 }}>No checksheet transactions yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalCount}
              page={Math.max(0, page - 1)}
              onPageChange={(_, nextPage) => setPage(nextPage + 1)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </TableContainer>
        )}
      </Stack>

      <CreateSubmissionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Checksheet Transaction"
        text={`Delete DRAFT transaction "${deleteTarget?.machineCode || ""}" on ${deleteTarget?.inspectionDate || "-"}?`}
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteSubmissionMutation.isPending}
        onConfirmDialogClose={() => setDeleteTarget(null)}
        onYesClick={() => {
          if (!deleteTarget) return;
          deleteSubmissionMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null)
          });
        }}
      />
    </Box>
  );
}
