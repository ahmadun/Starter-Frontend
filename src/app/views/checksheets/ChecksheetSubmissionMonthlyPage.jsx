import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  ButtonGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  Tooltip,
  Typography
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ConfirmationDialog } from "app/components";
import useAuth from "app/hooks/useAuth";
import {
  useApproveDailyInspectionStep,
  useApproveRepairRecord,
  useChecksheetSubmissionMonthlyView,
  useCreateInspectionRecord,
  useCreateRepairRecord,
  useDeleteInspectionRecord,
  useDeleteRepairRecord,
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

function toMonthInputValue(dateString) {
  if (!dateString) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  return String(dateString).slice(0, 7);
}

function parseMonthInput(value) {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function createDefaultEntryValues(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.templateItemId] = {
      templateItemId: item.templateItemId,
      resultValue: "",
      remark: ""
    };
    return accumulator;
  }, {});
}

function getCellForDay(item, day) {
  return item?.days?.find((cell) => cell.day === day) ?? null;
}

function createEntryValuesForDay(items, day) {
  const initial = createDefaultEntryValues(items);

  items.forEach((item) => {
    const cell = getCellForDay(item, day);
    initial[item.templateItemId] = {
      templateItemId: item.templateItemId,
      resultValue: cell?.resultValue ?? "",
      remark: cell?.remark ?? ""
    };
  });

  return initial;
}

function getRecordIdForDay(items, day) {
  for (const item of items) {
    const recordId = getCellForDay(item, day)?.recordId;
    if (recordId) {
      return recordId;
    }
  }

  return null;
}

function getResultColor(resultValue) {
  if (resultValue === "OK") return { bg: "#e8f5e9", color: "#1b5e20" };
  if (resultValue === "NG") return { bg: "#ffebee", color: "#b71c1c" };
  if (resultValue === "FIX") return { bg: "#fff8e1", color: "#8d6e00" };
  return { bg: "#f8fafc", color: "#64748b" };
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

function buildRowSpanMap(items, columns, valueAccessor) {
  const mergeState = {};

  columns.forEach((column) => {
    const columnOptions = parseColumnOptions(column.optionsJson);
    if (!(column.enableRowSpan ?? columnOptions.enableRowSpan)) {
      return;
    }

    const columnKey = column.columnKey ?? column.key;
    mergeState[columnKey] = {};

    let groupStartIndex = 0;
    let previousValue = normalizeMergeValue(valueAccessor(items[0], column));

    for (let rowIndex = 1; rowIndex <= items.length; rowIndex += 1) {
      const currentValue = normalizeMergeValue(valueAccessor(items[rowIndex], column));
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

function formatMonthTitle(monthValue) {
  const { year, month } = parseMonthInput(monthValue);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function toTitleCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
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

function getApproverDisplayName(person) {
  return person?.fullName || person?.approvedByFullName || person?.username || person?.approvedByUsername || "-";
}

function getApproverInitials(person) {
  const name = getApproverDisplayName(person);
  if (!name || name === "-") {
    return "?";
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function getMonthlySheetColumnSx(columnKey, columnIndex) {
  const isNumberColumn = columnKey === "itemNo";
  const isLongTextColumn = ["itemName", "method", "criteria", "tujuan", "konten", "item", "metodePengecekan", "penilaian"].includes(columnKey);

  return {
    width: isNumberColumn ? 72 : isLongTextColumn ? 220 : 140,
    minWidth: isNumberColumn ? 72 : isLongTextColumn ? 160 : 120,
    maxWidth: isNumberColumn ? 72 : isLongTextColumn ? 220 : 160,
    pl: columnIndex === 0 ? 3 : 2,
    py: 1.25,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.35
  };
}

export default function ChecksheetSubmissionMonthlyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const submissionId = Number(id);

  const [monthValue, setMonthValue] = useState(() => toMonthInputValue());
  const { year, month } = useMemo(() => parseMonthInput(monthValue), [monthValue]);
  const bootstrapMonthlyQuery = useChecksheetSubmissionMonthlyView(
    submissionId,
    { year, month },
    { enabled: !!submissionId }
  );
  const bootstrapMode = normalizeChecksheetMode(bootstrapMonthlyQuery.data?.checksheetMode);
  const supportedModes = useMemo(() => {
    const modes = bootstrapMonthlyQuery.data?.availableModes ?? [];
    return [...new Set(modes.map((mode) => normalizeChecksheetMode(mode)).filter(Boolean))];
  }, [bootstrapMonthlyQuery.data?.availableModes]);
  const secondaryMode = useMemo(
    () => supportedModes.find((mode) => mode !== bootstrapMode) ?? null,
    [bootstrapMode, supportedModes]
  );
  const secondaryMonthlyQuery = useChecksheetSubmissionMonthlyView(
    submissionId,
    secondaryMode ? { year, month, checksheetMode: secondaryMode } : { year, month },
    { enabled: !!submissionId && !!secondaryMode }
  );

  const createInspectionMutation = useCreateInspectionRecord(submissionId);
  const deleteInspectionMutation = useDeleteInspectionRecord(submissionId);
  const approveDailyStepMutation = useApproveDailyInspectionStep(submissionId);
  const createRepairMutation = useCreateRepairRecord(submissionId);
  const approveRepairMutation = useApproveRepairRecord();
  const deleteRepairMutation = useDeleteRepairRecord(submissionId);

  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMode, setSelectedMode] = useState("daily");
  const [inspectionShift, setInspectionShift] = useState("1");
  const [inspectionNote, setInspectionNote] = useState("");
  const [entryValues, setEntryValues] = useState({});
  const [repairForm, setRepairForm] = useState(createEmptyRepairForm());
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!supportedModes.length) return;
    setSelectedMode((current) => (supportedModes.includes(current) ? current : bootstrapMode || supportedModes[0]));
  }, [bootstrapMode, supportedModes]);

  const availableModes = supportedModes;
  const monthlyViews = useMemo(() => {
    const viewMap = new Map();
    [bootstrapMonthlyQuery.data, secondaryMonthlyQuery.data].forEach((view) => {
      const mode = normalizeChecksheetMode(view?.checksheetMode);
      if (view && mode && !viewMap.has(mode)) {
        viewMap.set(mode, view);
      }
    });
    return Array.from(viewMap.entries()).map(([mode, view]) => ({ mode, view }));
  }, [bootstrapMonthlyQuery.data, secondaryMonthlyQuery.data]);
  const monthlyView = monthlyViews.find((entry) => entry.mode === selectedMode)?.view ?? bootstrapMonthlyQuery.data ?? secondaryMonthlyQuery.data ?? null;
  const referenceView = bootstrapMonthlyQuery.data ?? secondaryMonthlyQuery.data ?? null;
  const isMonthlyLoading = bootstrapMonthlyQuery.isLoading || secondaryMonthlyQuery.isLoading;
  const monthlyError = bootstrapMonthlyQuery.error || secondaryMonthlyQuery.error;
  const isMonthlyError = !referenceView && !isMonthlyLoading;

  useEffect(() => {
    if (referenceView?.inspectionDate) {
      setMonthValue(toMonthInputValue(referenceView.inspectionDate));
    }
  }, [referenceView?.inspectionDate]);

  const monthlyItems = useMemo(() => monthlyView?.items ?? [], [monthlyView?.items]);
  const checksheetMode = normalizeChecksheetMode(monthlyView?.checksheetMode, "daily");
  const dailyApprovalSteps = useMemo(
    () => [...(monthlyView?.dailyApprovalSteps ?? [])].sort((left, right) => left.stepOrder - right.stepOrder),
    [monthlyView?.dailyApprovalSteps]
  );
  const regularApprovalSteps = useMemo(
    () => [...(monthlyView?.regularApprovalSteps ?? [])].sort((left, right) => left.stepOrder - right.stepOrder),
    [monthlyView?.regularApprovalSteps]
  );
  const displayColumns = useMemo(() => {
    const templateColumns = referenceView?.templateColumns ?? [];
    if (templateColumns.length > 0) {
      return templateColumns.map((column) => ({
        key: column.columnKey,
        columnKey: column.columnKey,
        label: column.label,
        optionsJson: column.optionsJson,
        enableRowSpan: column.enableRowSpan
      }));
    }

    const firstItem = monthlyItems[0];
    if (!firstItem?.itemData) {
      return [];
    }

    return Object.keys(firstItem.itemData).map((key) => ({
      key,
      label: toTitleCase(key)
    }));
  }, [monthlyItems, referenceView?.templateColumns]);
  const monthlyRowSpanMap = useMemo(
    () => buildRowSpanMap(monthlyItems, displayColumns, (item, column) => item?.itemData?.[column.key]),
    [displayColumns, monthlyItems]
  );

  const monthDays = monthlyView?.periodEnd ? Number(String(monthlyView.periodEnd).slice(8, 10)) : 31;
  const daySummaryMap = useMemo(
    () => new Map((monthlyView?.daySummaries ?? []).map((daySummary) => [daySummary.day, daySummary])),
    [monthlyView?.daySummaries]
  );
  const availableDays = useMemo(() => {
    return Array.from({ length: monthDays }, (_, index) => index + 1);
  }, [monthDays]);
  const selectedDaySummary = daySummaryMap.get(selectedDay) ?? null;
  const existingRecordId = useMemo(() => getRecordIdForDay(monthlyItems, selectedDay), [monthlyItems, selectedDay]);
  const updateInspectionForRecordMutation = useUpdateInspectionRecord(submissionId, existingRecordId);
  const isDraft = monthlyView?.status === "draft";
  const isInspectionMutationPending =
    createInspectionMutation.isPending ||
    updateInspectionForRecordMutation.isPending ||
    deleteInspectionMutation.isPending ||
    approveDailyStepMutation.isPending;

  useEffect(() => {
    if (!monthlyView) return;
    setSelectedDay((current) => (availableDays.includes(current) ? current : availableDays[0]));
  }, [availableDays, monthlyView]);

  useEffect(() => {
    if (!monthlyItems.length) {
      setEntryValues({});
      setInspectionShift(referenceView?.shift ?? "1");
      setInspectionNote("");
      return;
    }

    setEntryValues(createEntryValuesForDay(monthlyItems, selectedDay));
    setInspectionShift(selectedDaySummary?.shift ?? referenceView?.shift ?? "1");
    setInspectionNote(selectedDaySummary?.note ?? "");
  }, [monthlyItems, referenceView?.shift, selectedDay, selectedDaySummary?.note, selectedDaySummary?.shift]);

  const selectedDateString = `${monthValue}-${String(selectedDay).padStart(2, "0")}`;

  const hasAnyInspectionValue = useMemo(
    () => Object.values(entryValues).some((value) => value.resultValue?.trim() || value.remark?.trim()) || inspectionNote.trim().length > 0,
    [entryValues, inspectionNote]
  );

  const summaryStats = useMemo(() => {
    const filledDays = new Set();

    monthlyItems.forEach((item) => {
      item.days.forEach((cell) => {
        if (cell.recordId) {
          filledDays.add(cell.day);
        }
      });
    });

    const totalDays = monthDays;

    return {
      totalDays,
      filledDays: filledDays.size,
      blankDays: Math.max(totalDays - filledDays.size, 0)
    };
  }, [monthDays, monthlyItems]);

  if (isMonthlyLoading) {
    return <Box sx={{ p: 3 }}><Typography color="text.secondary">Loading monthly detail...</Typography></Box>;
  }

  if (isMonthlyError || !monthlyView || !referenceView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{monthlyError?.message || "Monthly detail not found."}</Alert>
      </Box>
    );
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

  const handleSaveInspectionRecord = () => {
    const payload = {
      recordType: checksheetMode,
      inspectionDate: selectedDateString,
      shift: inspectionShift || null,
      note: inspectionNote.trim() || null,
      values: monthlyItems
        .map((item) => entryValues[item.templateItemId] ?? { templateItemId: item.templateItemId, resultValue: "", remark: "" })
        .filter((value) => value.resultValue?.trim() || value.remark?.trim())
    };

    if (existingRecordId) {
      updateInspectionForRecordMutation.mutate(payload);
      return;
    }

    createInspectionMutation.mutate(payload);
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

  const canApproveStepForDay = (daySummary, step, steps) => {
    if (!daySummary?.recordId) return false;
    if (!user?.id) return false;

    const alreadyApproved = daySummary.approvals?.some((approval) => approval.stepId === step.id);
    if (alreadyApproved) return false;

    if (step.approver?.userId !== user.id) return false;

    return steps
      .filter((entry) => entry.stepOrder < step.stepOrder)
      .every((entry) => daySummary.approvals?.some((approval) => approval.stepId === entry.id));
  };

  const renderModeSheet = (modeView) => {
    const mode = (modeView?.checksheetMode ?? "daily").toLowerCase();
    const isModeRegular = mode === "regular";
    const modeItems = modeView?.items ?? [];
    const modeApprovalSteps = [
      ...(isModeRegular ? modeView?.regularApprovalSteps ?? [] : modeView?.dailyApprovalSteps ?? [])
    ].sort((left, right) => left.stepOrder - right.stepOrder);
    const modeDisplayColumns = (() => {
      const templateColumns = referenceView?.templateColumns ?? [];
      if (templateColumns.length > 0) {
        return templateColumns.map((column) => ({
          key: column.columnKey,
          columnKey: column.columnKey,
          label: column.label,
          optionsJson: column.optionsJson,
          enableRowSpan: column.enableRowSpan
        }));
      }
      const firstItem = modeItems[0];
      if (!firstItem?.itemData) {
        return [];
      }
      return Object.keys(firstItem.itemData).map((key) => ({
        key,
        label: toTitleCase(key)
      }));
    })();
    const modeRowSpanMap = buildRowSpanMap(modeItems, modeDisplayColumns, (item, column) => item?.itemData?.[column.key]);
    const modeMonthDays = modeView?.periodEnd ? Number(String(modeView.periodEnd).slice(8, 10)) : 31;
    const modeDaySummaryMap = new Map((modeView?.daySummaries ?? []).map((daySummary) => [daySummary.day, daySummary]));
    const modeAvailableDays = isModeRegular
      ? (modeView?.daySummaries ?? [])
        .filter((daySummary) => daySummary.recordId)
        .map((daySummary) => daySummary.day)
      : Array.from({ length: modeMonthDays }, (_, index) => index + 1);
    const uniqueModeDays = [...new Set(modeAvailableDays)].sort((left, right) => left - right);
    const modeDays = uniqueModeDays.length > 0 ? uniqueModeDays : [selectedDay];
    const modeSelectedDay = selectedMode === mode && modeDays.includes(selectedDay) ? selectedDay : modeDays[0];
    const modeFilledDays = new Set();
    modeItems.forEach((item) => {
      item.days.forEach((cell) => {
        if (cell.recordId) modeFilledDays.add(cell.day);
      });
    });
    const modeTotalDays = modeMonthDays;

    return (
      <Paper key={`sheet-${mode}`} variant="outlined" sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6">{mode === "daily" ? "Daily Monthly Sheet" : "Regular Monthly Sheet"}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`${modeFilledDays.size}/${modeTotalDays} filled`} variant="outlined" />
            <Chip label={`Mode: ${String(mode).toUpperCase()}`} variant="outlined" />
          </Stack>
        </Stack>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            maxHeight: "72vh",
            overflowX: "auto",
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: Math.max(880, modeDisplayColumns.length * 140 + modeDays.length * 58),
              tableLayout: "fixed",
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
                {modeDisplayColumns.map((column, columnIndex) => (
                  <TableCell
                    key={`${mode}-${column.key}`}
                    sx={{
                      bgcolor: "#f8fafc",
                      ...getMonthlySheetColumnSx(column.key, columnIndex)
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {modeDays.map((day) => {
                  const isSelected = selectedMode === mode && day === modeSelectedDay;
                  return (
                    <TableCell
                      key={`${mode}-day-${day}`}
                      align="center"
                      onClick={() => {
                        setSelectedMode(mode);
                        setSelectedDay(day);
                      }}
                      sx={{
                        minWidth: 58,
                        width: 58,
                        px: 1,
                        cursor: "pointer",
                        bgcolor: isSelected ? "#dbeafe" : "#f8fafc",
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      {day}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {modeItems.map((item, rowIndex) => (
                <TableRow key={`${mode}-${item.templateItemId}`} hover>
                  {modeDisplayColumns.map((column, columnIndex) => {
                    const mergeCell = modeRowSpanMap[column.key]?.[rowIndex];

                    if (mergeCell?.hidden) {
                      return null;
                    }

                    return (
                      <TableCell
                        key={`${mode}-${item.templateItemId}-${column.key}`}
                        rowSpan={mergeCell?.rowSpan ?? 1}
                        data-merged={(mergeCell?.rowSpan ?? 1) > 1 ? "true" : undefined}
                        sx={{
                          verticalAlign: "middle",
                          ...getMonthlySheetColumnSx(column.key, columnIndex)
                        }}
                      >
                        {(mergeCell?.rowSpan ?? 1) > 1 ? (
                          <Box sx={{ display: "flex", alignItems: "center", minHeight: "100%", height: "100%", width: "100%" }}>
                            {item.itemData?.[column.key] || "-"}
                          </Box>
                        ) : (
                          item.itemData?.[column.key] || "-"
                        )}
                      </TableCell>
                    );
                  })}
                  {modeDays.map((day) => {
                    const cell = getCellForDay(item, day);
                    const palette = getResultColor(cell?.resultValue);
                    const isSelected = selectedMode === mode && day === modeSelectedDay;
                    return (
                      <TableCell
                        key={`${mode}-${item.templateItemId}-${day}`}
                        align="center"
                        onClick={() => {
                          setSelectedMode(mode);
                          setSelectedDay(day);
                        }}
                        sx={{ cursor: "pointer", bgcolor: isSelected ? "#dbeafe" : palette.bg }}
                      >
                        <Tooltip title={cell?.remark || cell?.note || cell?.resultValue || "No entry"}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: isSelected ? "#0f172a" : palette.color }}>
                            {cell?.resultValue || "-"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={modeDisplayColumns.length} sx={{ fontWeight: 700, bgcolor: "#f8fafc", pl: 3 }}>Shift</TableCell>
                {modeDays.map((day) => {
                  const daySummary = modeDaySummaryMap.get(day);
                  const isSelected = selectedMode === mode && day === modeSelectedDay;
                  return (
                    <TableCell key={`${mode}-shift-${day}`} align="center" sx={{ bgcolor: isSelected ? "#dbeafe" : "#fff" }}>
                      {daySummary?.recordId ? daySummary.shift || "-" : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
              {modeApprovalSteps.map((step) => (
                <TableRow key={`${mode}-approval-row-${step.id}`}>
                  <TableCell colSpan={modeDisplayColumns.length} sx={{ fontWeight: 700, bgcolor: "#f8fafc", pl: 3 }}>{step.stepName}</TableCell>
                  {modeDays.map((day) => {
                    const daySummary = modeDaySummaryMap.get(day);
                    const approval = daySummary?.approvals?.find((entry) => entry.stepId === step.id);
                    const canApprove = canApproveStepForDay(daySummary, step, modeApprovalSteps);
                    const isSelected = selectedMode === mode && day === modeSelectedDay;
                    return (
                      <TableCell key={`${mode}-approval-${step.id}-${day}`} align="center" sx={{ bgcolor: isSelected ? "#dbeafe" : "#fff" }}>
                        {approval ? (
                          <Tooltip title={getApproverDisplayName(approval)}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                mx: "auto",
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: "success.main"
                              }}
                            >
                              {getApproverInitials(approval)}
                            </Avatar>
                          </Tooltip>
                        ) : canApprove ? (
                          <Tooltip title="Approve">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={approveDailyStepMutation.isPending}
                                onClick={() => approveDailyStepMutation.mutate({ recordId: daySummary.recordId, stepId: step.id })}
                                sx={{
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                  borderRadius: 1.5,
                                  p: 0.5,
                                  "&:hover": {
                                    bgcolor: "primary.dark"
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: "action.disabledBackground",
                                    color: "action.disabled"
                                  }
                                }}
                              >
                                <CheckOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Monthly Inspection Detail</Typography>
            <Typography variant="body2" color="text.secondary">
              Daily results, shift, and simple day-by-day approvals are shown in one horizontal month sheet.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate(`/checksheets/submissions/${submissionId}`)}
          >
            Back To Detail
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={700}>{monthlyView.machineCode}</Typography>
              <Typography variant="body2" color="text.secondary">
                {monthlyView.location} | {monthlyView.lineName}
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} flexWrap="wrap">
                <Typography variant="body2"><strong>Group:</strong> {monthlyView.groupCodes?.join(", ") || "-"}</Typography>
                <Typography variant="body2"><strong>Status:</strong> {formatSubmissionStatus(monthlyView.status)}</Typography>
              </Stack>
            </Stack>

            <Stack spacing={1.5} sx={{ minWidth: { lg: 260 } }}>
              <TextField
                label="Month"
                type="month"
                value={monthValue}
                onChange={(event) => setMonthValue(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${summaryStats.filledDays}/${summaryStats.totalDays} filled`} variant="outlined" />
                <Chip label={`${summaryStats.blankDays} blank`} variant="outlined" />
                <Chip label={`Mode: ${checksheetMode}`} variant="outlined" />
              </Stack>
            </Stack>
          </Stack>
        </Paper>
        <Typography variant="h6">{formatMonthTitle(monthValue)}</Typography>
        {monthlyViews.map((entry) => renderModeSheet(entry.view))}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Inspection Entry Editor</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selected date: {selectedDateString}
          </Typography>
          <ToggleButton
            size="small"
            value={selectedMode}
            selected
            sx={{ mb: 2 }}
            onChange={() => setSelectedMode((current) => (current === "daily" ? "regular" : "daily"))}
            disabled={!availableModes.includes(selectedMode === "daily" ? "regular" : "daily")}
          >
            Editing Mode: {selectedMode}
          </ToggleButton>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {(selectedMode === "regular" ? regularApprovalSteps : dailyApprovalSteps).map((step) => {
              const approval = selectedDaySummary?.approvals?.find((entry) => entry.stepId === step.id);
              return (
                <Chip
                  key={`${selectedMode}-selected-step-${step.id}`}
                  label={approval ? `${step.stepName}: ${getApproverDisplayName(approval)}` : `${step.stepName}: Pending`}
                  color={approval ? "success" : "default"}
                  variant="outlined"
                />
              );
            })}
            {(selectedMode === "regular" ? regularApprovalSteps : dailyApprovalSteps).length === 0 && (
              <Chip
                label={`No ${selectedMode === "regular" ? "regular" : "daily"} approval steps`}
                variant="outlined"
              />
            )}
          </Stack>

          <TextField
            select
            label="Selected Day"
            value={selectedDay}
            onChange={(event) => setSelectedDay(Number(event.target.value))}
            sx={{ mb: 2, minWidth: 180 }}
            disabled={!isDraft || isInspectionMutationPending}
          >
            {availableDays.map((day) => (
              <MenuItem key={day} value={day}>{day}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Shift"
            value={inspectionShift}
            onChange={(event) => setInspectionShift(event.target.value)}
            sx={{ mb: 2, ml: 1, minWidth: 180 }}
            disabled={!isDraft || isInspectionMutationPending}
          >
            {["1", "2", "3"].map((shift) => (
              <MenuItem key={shift} value={shift}>Shift {shift}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Note"
            value={inspectionNote}
            onChange={(event) => setInspectionNote(event.target.value)}
            multiline
            minRows={2}
            fullWidth
            sx={{ mb: 2 }}
            disabled={!isDraft || isInspectionMutationPending}
          />
          <Box sx={{ overflowX: "auto", mx: -1.5, px: 1.5 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ minWidth: 600 }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderRight: 1,
                    borderColor: "divider",
                    verticalAlign: "top"
                  },
                  "& .MuiTableCell-root:last-of-type": { borderRight: 0 },
                  "& .MuiTableHead-root .MuiTableCell-root": { fontWeight: 700 },
                  "& .MuiTableCell-root[data-merged='true']": { verticalAlign: "middle" }
                }}
              >
                <TableHead>
                  <TableRow>
                    {displayColumns.map((column, columnIndex) => (
                      <TableCell key={column.key} sx={{ minWidth: column.key === "itemNo" ? 80 : 180, pl: columnIndex === 0 ? 3 : 2 }}>
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell sx={{ width: 150, minWidth: 150, pl: 2 }}>Entry</TableCell>
                    <TableCell sx={{ width: 160, minWidth: 160, pl: 2 }}>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyItems.map((item, rowIndex) => (
                    <TableRow key={item.templateItemId} hover>
                      {displayColumns.map((column, columnIndex) => {
                        const mergeCell = monthlyRowSpanMap[column.key]?.[rowIndex];

                        if (mergeCell?.hidden) {
                          return null;
                        }

                        return (
                          <TableCell
                            key={`${item.templateItemId}-${column.key}`}
                            rowSpan={mergeCell?.rowSpan ?? 1}
                            data-merged={(mergeCell?.rowSpan ?? 1) > 1 ? "true" : undefined}
                            sx={{
                              verticalAlign: "middle",
                              whiteSpace: column.key === "itemName" || column.key === "method" || column.key === "criteria" ? "normal" : "nowrap",
                              wordBreak: "break-word",
                              pl: columnIndex === 0 ? 3 : 2
                            }}
                          >
                            {(mergeCell?.rowSpan ?? 1) > 1 ? (
                              <Box sx={{ display: "flex", alignItems: "center", minHeight: "100%", height: "100%" }}>
                                {item.itemData?.[column.key] || "-"}
                              </Box>
                            ) : (
                              item.itemData?.[column.key] || "-"
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ width: 150, minWidth: 150, pl: 2 }}>
                        {item.valueType === "fixed" ? (
                          <ButtonGroup
                            size="small"
                            disabled={!isDraft || isInspectionMutationPending}
                            sx={{ flexShrink: 0 }}
                          >
                            {FIXED_OPTIONS.map((option) => {
                              const isSelected = (entryValues[item.templateItemId]?.resultValue ?? "") === option;
                              return (
                                <Button
                                  key={`${item.templateItemId}-${option}`}
                                  variant={isSelected ? "contained" : "outlined"}
                                  onClick={() => handleInspectionValueChange(item.templateItemId, { resultValue: option })}
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
                            value={entryValues[item.templateItemId]?.resultValue ?? ""}
                            onChange={(e) => handleInspectionValueChange(item.templateItemId, { resultValue: e.target.value })}
                            placeholder="Enter value"
                            size="small"
                            fullWidth
                            disabled={!isDraft || isInspectionMutationPending}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ width: 160, minWidth: 160, pl: 2 }}>
                        <TextField
                          value={entryValues[item.templateItemId]?.remark ?? ""}
                          onChange={(e) => handleInspectionValueChange(item.templateItemId, { remark: e.target.value })}
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
            {isDraft && existingRecordId && (
              <Button
                color="error"
                variant="outlined"
                disabled={deleteInspectionMutation.isPending}
                onClick={() => setDeleteTarget({ type: "inspection", id: existingRecordId })}
              >
                Delete Selected Day
              </Button>
            )}
            <Button
              variant="contained"
              disabled={!isDraft || !hasAnyInspectionValue || isInspectionMutationPending}
              onClick={handleSaveInspectionRecord}
            >
              {isInspectionMutationPending ? "Saving..." : existingRecordId ? "Save Day Changes" : "Save Day Record"}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Repair Records</Typography>
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

            {referenceView.repairRecords?.length > 0 ? (
              referenceView.repairRecords.map((record) => (
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
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No repair records yet.</Typography>
            )}
          </Stack>
        </Paper>
      </Stack>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Record"
        text="Delete this checksheet record?"
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteInspectionMutation.isPending || deleteRepairMutation.isPending}
        onConfirmDialogClose={() => setDeleteTarget(null)}
        onYesClick={() => {
          if (!deleteTarget) return;
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
