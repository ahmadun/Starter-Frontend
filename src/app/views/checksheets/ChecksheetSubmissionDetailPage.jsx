import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  RadioGroup,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  ButtonGroup
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { ConfirmationDialog } from "app/components";
import useAuth from "app/hooks/useAuth";
import {
  useApproveDailyInspectionStep,
  useApproveRepairRecord,
  useApprovalTemplates,
  useChecksheetMachines,
  useChecksheetSubmission,
  useChecksheetSubmissionMonthlyView,
  useCreateInspectionRecord,
  useCreateRepairRecord,
  useDeleteInspectionRecord,
  useDeleteRepairRecord,
  useCreateApprovalRequest,
  useDeleteChecksheetSubmission,
  useUpdateChecksheetSubmission,
  useUpdateInspectionRecord
} from "app/hooks/useChecksheets";

const FIXED_OPTIONS = ["OK", "NG", "FIX"];

function formatSubmissionStatus(status) {
  return typeof status === "string" ? status.toUpperCase() : "-";
}

function createEmptyRepairForm() {
  return {
    repairDate: "",
    damageDescription: "",
    repairDescription: "",
    note: ""
  };
}

function createInitialEntryValues(items) {
  return items.reduce((accumulator, item) => {
    const itemId = item.id ?? item.templateItemId;
    accumulator[itemId] = {
      templateItemId: itemId,
      resultValue: "",
      remark: ""
    };
    return accumulator;
  }, {});
}

function createEntryValuesFromRecord(items, record) {
  const initialValues = createInitialEntryValues(items);

  if (!record) {
    return initialValues;
  }

  record.values.forEach((value) => {
    if (!initialValues[value.templateItemId]) {
      return;
    }

    initialValues[value.templateItemId] = {
      templateItemId: value.templateItemId,
      resultValue: value.resultValue ?? "",
      remark: value.remark ?? ""
    };
  });

  return initialValues;
}

function parseYearMonth(dateString) {
  if (!dateString) return null;
  const [year, month] = String(dateString).split("-").map(Number);
  if (!year || !month) return null;
  return { year, month };
}

function normalizeChecksheetMode(mode, fallback = "") {
  const normalizedMode = String(mode || "").toLowerCase().trim();

  if (["monthly", "regular", "reguler"].includes(normalizedMode)) {
    return "regular";
  }

  if (normalizedMode === "daily") {
    return "daily";
  }

  return fallback ? normalizeChecksheetMode(fallback, "") : normalizedMode;
}

function mapRecordTypeToUi(recordType) {
  return normalizeChecksheetMode(recordType, "daily");
}

function getLatestRecordForMode(records, mode) {
  const normalizedMode = normalizeChecksheetMode(mode);
  return [...(records ?? [])]
    .filter((record) => mapRecordTypeToUi(record.recordType) === normalizedMode)
    .sort((left, right) => {
      const leftDate = left.inspectionDate ? new Date(left.inspectionDate).getTime() : 0;
      const rightDate = right.inspectionDate ? new Date(right.inspectionDate).getTime() : 0;
      return rightDate - leftDate || right.id - left.id;
    })[0] ?? null;
}

function toTitleCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function getApproverDisplayName(person) {
  return person?.fullName || person?.approvedByFullName || person?.username || person?.approvedByUsername || "-";
}

function parseColumnOptions(optionsJson) {
  if (!optionsJson) {
    return {};
  }

  try {
    return JSON.parse(optionsJson);
  } catch {
    return {};
  }
}

function normalizeMergeValue(value) {
  return String(value ?? "").trim();
}

function buildRowSpanMap(items, columns) {
  const mergeState = {};

  columns.forEach((column) => {
    const columnOptions = parseColumnOptions(column.optionsJson);
    if (!(column.enableRowSpan ?? columnOptions.enableRowSpan)) {
      return;
    }

    const columnKey = column.columnKey;
    mergeState[columnKey] = {};

    let groupStartIndex = 0;
    let previousValue = normalizeMergeValue(items[0]?.data?.[columnKey]);

    for (let rowIndex = 1; rowIndex <= items.length; rowIndex += 1) {
      const currentValue = normalizeMergeValue(items[rowIndex]?.data?.[columnKey]);
      const isGroupBoundary = rowIndex === items.length || currentValue !== previousValue || !previousValue;

      if (isGroupBoundary) {
        const rowSpan = rowIndex - groupStartIndex;

        mergeState[columnKey][groupStartIndex] = {
          hidden: false,
          rowSpan
        };

        for (let hiddenIndex = groupStartIndex + 1; hiddenIndex < rowIndex; hiddenIndex += 1) {
          mergeState[columnKey][hiddenIndex] = {
            hidden: rowSpan > 1,
            rowSpan: 1
          };
        }

        groupStartIndex = rowIndex;
        previousValue = currentValue;
      }
    }
  });

  return mergeState;
}

export default function ChecksheetSubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const submissionId = Number(id);
  const [selectedMode, setSelectedMode] = useState("");
  const {
    data: baseSubmission,
    isLoading: isBaseLoading,
    isError: isBaseError,
    error: baseError
  } = useChecksheetSubmission(submissionId);
  const checksheetMode = normalizeChecksheetMode(selectedMode || baseSubmission?.checksheetMode || "");
  const { data: submission, isLoading, isError, error } = useChecksheetSubmission(submissionId, {
    params: checksheetMode ? { checksheetMode } : undefined,
    enabled: !!submissionId && !!checksheetMode
  });
  const { data: approvalTemplates } = useApprovalTemplates({ page: 1, pageSize: 100, isActive: true });
  const createInspectionMutation = useCreateInspectionRecord(submissionId);
  const { data: machinesPage } = useChecksheetMachines({ page: 1, pageSize: 100 });
  const updateSubmissionMutation = useUpdateChecksheetSubmission(submissionId);
  const deleteSubmissionMutation = useDeleteChecksheetSubmission();
  const createRepairMutation = useCreateRepairRecord(submissionId);
  const approveRepairMutation = useApproveRepairRecord();
  const deleteInspectionMutation = useDeleteInspectionRecord(submissionId);
  const deleteRepairMutation = useDeleteRepairRecord(submissionId);
  const createApprovalMutation = useCreateApprovalRequest(submissionId);
  const approveDailyStepMutation = useApproveDailyInspectionStep(submissionId);
  const [approvalTemplateId, setApprovalTemplateId] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionShift, setInspectionShift] = useState("1");
  const [inspectionNote, setInspectionNote] = useState("");
  const [entryValues, setEntryValues] = useState({});
  const [repairForm, setRepairForm] = useState(createEmptyRepairForm());
  const [deleteTarget, setDeleteTarget] = useState(null);

  const inspectionRecords = submission?.inspectionRecords ?? [];
  const existingInspectionRecord = useMemo(
    () => getLatestRecordForMode(inspectionRecords, checksheetMode),
    [inspectionRecords, checksheetMode]
  );
  const updateInspectionMutation = useUpdateInspectionRecord(submissionId, existingInspectionRecord?.id);
  const monthlyParams = useMemo(
    () => {
      const base = parseYearMonth(existingInspectionRecord?.inspectionDate ?? submission?.inspectionDate);
      return base ? { ...base, checksheetMode } : null;
    },
    [checksheetMode, existingInspectionRecord?.inspectionDate, submission?.inspectionDate]
  );
  const { data: monthlyView } = useChecksheetSubmissionMonthlyView(submissionId, monthlyParams, {
    enabled: !!submissionId && !!monthlyParams?.year && !!monthlyParams?.month
  });
  const templateColumns = useMemo(() => {
    if ((submission?.template?.columns?.length ?? 0) > 0) {
      return submission.template.columns;
    }

    const firstItem = monthlyView?.items?.[0];
    if (!firstItem?.itemData) {
      return [];
    }

    return Object.keys(firstItem.itemData).map((key, index) => ({
      id: `${key}-${index}`,
      columnKey: key,
      label: toTitleCase(key)
    }));
  }, [monthlyView?.items, submission?.template?.columns]);
  const templateItems = useMemo(() => {
    return submission?.template?.items ?? [];
  }, [submission?.template?.items]);
  const rowSpanMap = useMemo(() => buildRowSpanMap(templateItems, templateColumns), [templateItems, templateColumns]);
  const isDraft = submission?.status === "draft";
  const isOwner = Number(user?.id ?? 0) === Number(submission?.createdByUserId ?? 0);
  const machines = useMemo(() => machinesPage?.items ?? [], [machinesPage?.items]);
  const currentMachine = machines.find((item) => item.machineCode === submission?.machineCode);
  const machineModes = useMemo(() => {
    const modes = currentMachine?.modes?.length ? currentMachine.modes : [submission?.checksheetMode ?? "daily"];
    return [...new Set(modes.map((mode) => normalizeChecksheetMode(mode)).filter(Boolean))];
  }, [currentMachine?.modes, submission?.checksheetMode]);
  const isInspectionMutationPending = createInspectionMutation.isPending || updateInspectionMutation.isPending || approveDailyStepMutation.isPending;
  const currentRecordDay = existingInspectionRecord?.inspectionDate ? Number(String(existingInspectionRecord.inspectionDate).slice(8, 10)) : null;
  const currentDaySummary = useMemo(
    () => (currentRecordDay ? monthlyView?.daySummaries?.find((entry) => entry.day === currentRecordDay) ?? null : null),
    [monthlyView?.daySummaries, currentRecordDay]
  );
  const approvalSteps = useMemo(
    () =>
      [...(
        checksheetMode === "regular"
          ? monthlyView?.regularApprovalSteps ?? submission?.template?.regularApprovalSteps ?? []
          : monthlyView?.dailyApprovalSteps ?? submission?.template?.dailyApprovalSteps ?? []
      )].sort((left, right) => left.stepOrder - right.stepOrder),
    [
      checksheetMode,
      monthlyView?.dailyApprovalSteps,
      monthlyView?.regularApprovalSteps,
      submission?.template?.dailyApprovalSteps,
      submission?.template?.regularApprovalSteps
    ]
  );
  const recordValueMap = useMemo(() => {
    const map = new Map();
    (existingInspectionRecord?.values ?? []).forEach((value) => {
      map.set(value.templateItemId, {
        resultValue: value.resultValue ?? "",
        remark: value.remark ?? ""
      });
    });
    return map;
  }, [existingInspectionRecord?.values]);
  const templateItemIds = useMemo(() => templateItems.map((item) => item.id ?? item.templateItemId).join(","), [templateItems]);
  const inspectionValueSignature = useMemo(
    () =>
      (existingInspectionRecord?.values ?? [])
        .map((value) => `${value.templateItemId}:${value.resultValue ?? ""}:${value.remark ?? ""}`)
        .join("|"),
    [existingInspectionRecord?.values]
  );

  useEffect(() => {
    if (!selectedMode && baseSubmission?.checksheetMode) {
      setSelectedMode(normalizeChecksheetMode(baseSubmission.checksheetMode));
    }
  }, [baseSubmission?.checksheetMode, selectedMode]);

  useEffect(() => {
    setInspectionDate(existingInspectionRecord?.inspectionDate ?? submission?.inspectionDate ?? "");
    setInspectionShift(existingInspectionRecord?.shift ?? submission?.shift ?? "1");
    setInspectionNote(existingInspectionRecord?.note ?? "");
    setEntryValues(createEntryValuesFromRecord(templateItems, existingInspectionRecord));
  }, [
    existingInspectionRecord?.id,
    existingInspectionRecord?.inspectionDate,
    existingInspectionRecord?.shift,
    existingInspectionRecord?.note,
    existingInspectionRecord?.updatedAt,
    inspectionValueSignature,
    submission?.inspectionDate,
    submission?.shift,
    templateItemIds
  ]);

  const hasAnyInspectionValue = useMemo(
    () => Object.values(entryValues).some((value) => value.resultValue?.trim() || value.remark?.trim()),
    [entryValues]
  );

  if (isBaseLoading || isLoading) {
    return <Box sx={{ p: 3 }}><Typography color="text.secondary">Loading checksheet...</Typography></Box>;
  }

  if (isBaseError || isError || !submission) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{baseError?.message || error?.message || "Checksheet not found."}</Alert></Box>;
  }

  const handleInspectionValueChange = (itemId, patch) => {
    setEntryValues((current) => ({
      ...current,
      [itemId]: {
        templateItemId: itemId,
        resultValue: current[itemId]?.resultValue ?? "",
        remark: current[itemId]?.remark ?? "",
        ...patch
      }
    }));
  };

  const getEntryValue = (itemId, field) => {
    const localValue = entryValues[itemId]?.[field];
    if (localValue !== undefined) {
      return localValue;
    }

    return recordValueMap.get(itemId)?.[field] ?? "";
  };

  const handleSaveInspectionRecord = () => {
    const payload = {
      recordType: checksheetMode,
      inspectionDate: inspectionDate || null,
      shift: inspectionShift || null,
      note: inspectionNote.trim() || null,
      values: templateItems
        .map((item) => ({
          templateItemId: item.id,
          resultValue: getEntryValue(item.id, "resultValue"),
          remark: getEntryValue(item.id, "remark")
        }))
        .filter((value) => value.resultValue?.trim() || value.remark?.trim())
    };

    const mutation = existingInspectionRecord ? updateInspectionMutation : createInspectionMutation;
    mutation.mutate(payload);
  };

  const handleSaveRepairRecord = () => {
    createRepairMutation.mutate(
      {
        repairDate: repairForm.repairDate || null,
        damageDescription: repairForm.damageDescription.trim(),
        repairDescription: repairForm.repairDescription.trim(),
        note: repairForm.note.trim() || null
      },
      {
        onSuccess: () => setRepairForm(createEmptyRepairForm())
      }
    );
  };

  const canApproveInspectionStep = (step) => {
    if (!currentDaySummary?.recordId) return false;
    if (!user?.id) return false;
    if (step.approver?.userId !== user.id) return false;

    const alreadyApproved = currentDaySummary.approvals?.some((approval) => approval.stepId === step.id);
    if (alreadyApproved) return false;

    return approvalSteps
      .filter((entry) => entry.stepOrder < step.stepOrder)
      .every((entry) => currentDaySummary.approvals?.some((approval) => approval.stepId === entry.id));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{submission.machineCode}</Typography>
              <Typography variant="body2" color="text.secondary">
                {submission.location} | {submission.lineName}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={submission.checksheetMode.toUpperCase()} />
              <Chip
                label={formatSubmissionStatus(submission.status)}
                color={submission.status === "approved" ? "success" : submission.status === "submitted" ? "warning" : submission.status === "rejected" ? "error" : "default"}
              />
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2 }} flexWrap="wrap">
            <Typography variant="body2"><strong>Date:</strong> {submission.inspectionDate}</Typography>
            <Typography variant="body2"><strong>Shift:</strong> {submission.shift}</Typography>
            <Typography variant="body2"><strong>Group:</strong> {submission.groupCodes?.join(", ") || "-"}</Typography>
            <Typography variant="body2"><strong>Template:</strong> {submission.template?.name || "-"}</Typography>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }} alignItems={{ md: "center" }}>
            <Stack spacing={0.5}>
              <RadioGroup
                row
                value={checksheetMode}
                onChange={(event) => {
                  const nextMode = event.target.value;
                  setSelectedMode(nextMode);
                  updateSubmissionMutation.mutate({
                    machineCode: submission.machineCode,
                    checksheetMode: nextMode,
                    inspectionDate: submission.inspectionDate,
                    shift: submission.shift,
                    groupCodes: submission.groupCodes ?? []
                  });
                }}
                sx={{ gap: 1.5, flexWrap: "wrap" }}
              >
                {machineModes.map((mode) => (
                  <Paper
                    key={mode}
                    variant="outlined"
                    sx={{
                      px: 0.5,
                      borderRadius: 2,
                      borderColor: checksheetMode === mode ? "primary.main" : "divider",
                      bgcolor: checksheetMode === mode ? "primary.50" : "background.paper"
                    }}
                  >
                    <FormControlLabel
                      value={mode}
                      disabled={!isDraft || updateSubmissionMutation.isPending}
                      control={<Radio size="small" />}
                      label={String(mode).toUpperCase()}
                      sx={{
                        m: 0,
                        px: 1,
                        py: 0.25,
                        minHeight: 40,
                        "& .MuiFormControlLabel-label": {
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: 0.4
                        }
                      }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </Stack>
            {!isDraft && (
              <Typography variant="caption" color="text.secondary">
                Mode can only be changed in DRAFT status.
              </Typography>
            )}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<CalendarMonthOutlinedIcon />}
              onClick={() => navigate(`/checksheets/submissions/${submission.id}/monthly`)}
            >
              Open Monthly Detail
            </Button>
            {isDraft && isOwner && (
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                disabled={deleteSubmissionMutation.isPending}
                onClick={() => setDeleteTarget({ type: "submission", id: submission.id })}
              >
                Delete Transaction
              </Button>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">
            <Chip label={`${submission.inspectionRecords?.length ?? 0} inspection records`} variant="outlined" />
            <Chip label={`${submission.repairRecords?.length ?? 0} repair records`} variant="outlined" />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">Inspection Entry</Typography>
            </Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ minWidth: { md: 320 } }}>
              <TextField
                label="Inspection Date"
                type="date"
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label="Shift"
                value={inspectionShift}
                onChange={(event) => setInspectionShift(event.target.value)}
                fullWidth
              >
                {["1", "2", "3"].map((shift) => (
                  <MenuItem key={shift} value={shift}>Shift {shift}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <TextField
            label="Note"
            value={inspectionNote}
            onChange={(event) => setInspectionNote(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ overflowX: "auto", mx: -1.5, px: 1.5 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ minWidth: 480 }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderRight: 1,
                    borderColor: "divider",
                    verticalAlign: "top"
                  },
                  "& .MuiTableCell-root:last-of-type": {
                    borderRight: 0
                  },
                  "& .MuiTableHead-root .MuiTableCell-root": {
                    fontWeight: 700
                  },
                  "& .MuiTableCell-root[data-merged='true']": {
                    verticalAlign: "middle"
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    {templateColumns.map((column, columnIndex) => (
                      <TableCell key={column.id} sx={{ pl: columnIndex === 0 ? 3 : 2 }}>{column.label}</TableCell>
                    ))}
                    <TableCell sx={{ width: 150, minWidth: 150, pl: 2 }}>Entry</TableCell>
                    <TableCell sx={{ minWidth: 160, pl: 1 }}>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templateItems.map((item, rowIndex) => (
                    <TableRow key={item.id} hover>
                      {templateColumns.map((column, columnIndex) => {
                        const mergeCell = rowSpanMap[column.columnKey]?.[rowIndex];

                        if (mergeCell?.hidden) {
                          return null;
                        }

                        return (
                          <TableCell
                            key={`${item.id}-${column.columnKey}`}
                            rowSpan={mergeCell?.rowSpan ?? 1}
                            data-merged={(mergeCell?.rowSpan ?? 1) > 1 ? "true" : undefined}  // ✅ add this
                            sx={{
                              pl: columnIndex === 0 ? 3 : 2,
                              verticalAlign: "middle"
                            }}
                          >
                            {item.data?.[column.columnKey] || "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ width: 150, minWidth: 150, pl: 2 }}>
                        {(item.valueType ?? "fixed") === "fixed" ? (
                          <ButtonGroup
                            size="small"
                            disabled={!isDraft || isInspectionMutationPending}
                            sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                          >
                            {FIXED_OPTIONS.map((option) => {
                              const isSelected = getEntryValue(item.id, "resultValue") === option;
                              return (
                                <Button
                                  key={`${item.id}-${option}`}
                                  variant={isSelected ? "contained" : "outlined"}
                                  onClick={() => handleInspectionValueChange(item.id, { resultValue: option })}
                                  sx={{
                                    px: 1,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    minWidth: 40,
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {option}
                                </Button>
                              );
                            })}
                          </ButtonGroup>
                        ) : (
                          <TextField
                            value={getEntryValue(item.id, "resultValue")}
                            onChange={(e) => handleInspectionValueChange(item.id, { resultValue: e.target.value })}
                            placeholder="Enter value"
                            size="small"
                            fullWidth
                            disabled={!isDraft || isInspectionMutationPending}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ pl: 1 }}>
                        <TextField
                          value={getEntryValue(item.id, "remark")}
                          onChange={(event) => handleInspectionValueChange(item.id, { remark: event.target.value })}
                          placeholder="Remark"
                          size="small"
                          fullWidth
                          disabled={!isDraft || isInspectionMutationPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            {isDraft && existingInspectionRecord && (
              <Button
                color="error"
                variant="outlined"
                disabled={isInspectionMutationPending || deleteInspectionMutation.isPending}
                onClick={() => setDeleteTarget({ type: "inspection", id: existingInspectionRecord.id })}
              >
                Delete Inspection Entry
              </Button>
            )}
            <Button
              variant="contained"
              disabled={!isDraft || !hasAnyInspectionValue || isInspectionMutationPending}
              onClick={handleSaveInspectionRecord}
            >
              {isInspectionMutationPending ? "Saving..." : existingInspectionRecord ? "Save Changes" : "Save Inspection Record"}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {checksheetMode === "regular" ? "Regular Approval" : "Daily Approval"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approval for the current inspection date is available here. Steps follow the checksheet template and must be approved sequentially.
          </Typography>

          {existingInspectionRecord?.inspectionDate ? (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                <strong>Date:</strong> {existingInspectionRecord.inspectionDate} | <strong>Shift:</strong> {currentDaySummary?.shift || existingInspectionRecord.shift || "-"}
              </Typography>

              {approvalSteps.length > 0 ? (
                approvalSteps.map((step) => {
                  const approval = currentDaySummary?.approvals?.find((entry) => entry.stepId === step.id);
                  const canApprove = canApproveInspectionStep(step);

                  return (
                    <Paper key={step.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
                        <Box>
                          <Typography fontWeight={600}>{step.stepName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Approver: {getApproverDisplayName(step.approver)}
                          </Typography>
                        </Box>

                        {approval ? (
                          <Chip label={`Approved by ${getApproverDisplayName(approval)}`} color="success" variant="outlined" />
                        ) : canApprove ? (
                          <Button
                            variant="outlined"
                            disabled={approveDailyStepMutation.isPending}
                            onClick={() => approveDailyStepMutation.mutate({ recordId: currentDaySummary.recordId, stepId: step.id })}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Chip label={currentDaySummary?.recordId ? "Waiting previous step / assigned approver" : "Save record first"} variant="outlined" />
                        )}
                      </Stack>
                    </Paper>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No {checksheetMode === "regular" ? "regular" : "daily"} approval steps are configured on this checksheet template.
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Save a {checksheetMode === "regular" ? "regular" : "daily"} inspection record first to start approval.
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Month-End Submission</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use the separate monthly page for horizontal date review and final month-end approval submission.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthOutlinedIcon />}
              onClick={() => navigate(`/checksheets/submissions/${submission.id}/monthly`)}
            >
              Open Monthly Page
            </Button>
            <TextField
              select
              size="small"
              label="Approval Template"
              value={approvalTemplateId}
              onChange={(event) => setApprovalTemplateId(event.target.value)}
              sx={{ minWidth: 280 }}
            >
              {(approvalTemplates?.items ?? []).map((template) => (
                <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SendOutlinedIcon />}
              disabled={!isDraft || !approvalTemplateId || createApprovalMutation.isPending}
              onClick={() => createApprovalMutation.mutate({
                templateId: Number(approvalTemplateId),
                title: `${submission.machineCode} ${submission.inspectionDate} Shift ${submission.shift}`
              })}
            >
              {createApprovalMutation.isPending ? "Submitting..." : "Submit For Approval"}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Repair Entry</Typography>
          <Stack spacing={2}>
            <TextField
              label="Repair Date"
              type="date"
              value={repairForm.repairDate}
              onChange={(event) => setRepairForm((current) => ({ ...current, repairDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!isDraft || createRepairMutation.isPending}
            />
            <TextField
              label="Damage Description"
              value={repairForm.damageDescription}
              onChange={(event) => setRepairForm((current) => ({ ...current, damageDescription: event.target.value }))}
              multiline
              minRows={2}
              disabled={!isDraft || createRepairMutation.isPending}
            />
            <TextField
              label="Repair Description"
              value={repairForm.repairDescription}
              onChange={(event) => setRepairForm((current) => ({ ...current, repairDescription: event.target.value }))}
              multiline
              minRows={2}
              disabled={!isDraft || createRepairMutation.isPending}
            />
            <TextField
              label="Note"
              value={repairForm.note}
              onChange={(event) => setRepairForm((current) => ({ ...current, note: event.target.value }))}
              multiline
              minRows={2}
              disabled={!isDraft || createRepairMutation.isPending}
            />
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end">
              <Button
                variant="contained"
                disabled={!isDraft || !repairForm.damageDescription.trim() || !repairForm.repairDescription.trim() || createRepairMutation.isPending}
                onClick={handleSaveRepairRecord}
              >
                {createRepairMutation.isPending ? "Saving..." : "Save Repair Record"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Saved Repair Records</Typography>
          <Stack spacing={2}>
            {submission.repairRecords.map((record) => (
              <Paper key={record.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography fontWeight={600}>{record.damageDescription}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{record.repairDescription}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      {record.repairDate || "No date"} | Repaired by: {record.repairedByName || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      ASSY: {record.checkedByAssyName || "-"} | QA: {record.checkedByQaName || "-"} | MTA: {record.checkedByCoordinatorName || "-"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {(!record.checkedByAssyUserId || !record.checkedByQaUserId || !record.checkedByCoordinatorUserId) && (
                      <Button
                        variant="outlined"
                        disabled={approveRepairMutation.isPending}
                        onClick={() => approveRepairMutation.mutate({ submissionId, recordId: record.id })}
                      >
                        Approve Next Level
                      </Button>
                    )}
                    {isDraft && (
                      <IconButton color="error" onClick={() => setDeleteTarget({ type: "repair", id: record.id })}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {submission.repairRecords.length === 0 && <Typography variant="body2" color="text.secondary">No repair records yet.</Typography>}
          </Stack>
        </Paper>
      </Stack>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Record"
        text={deleteTarget?.type === "submission" ? "Delete this DRAFT checksheet transaction?" : "Delete this checksheet record?"}
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteInspectionMutation.isPending || deleteRepairMutation.isPending || deleteSubmissionMutation.isPending}
        onConfirmDialogClose={() => setDeleteTarget(null)}
        onYesClick={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "submission") {
            deleteSubmissionMutation.mutate(deleteTarget.id, {
              onSuccess: () => navigate("/checksheets/submissions")
            });
            return;
          }
          if (deleteTarget.type === "inspection") {
            deleteInspectionMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            return;
          }
          deleteRepairMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </Box>
  );
}
