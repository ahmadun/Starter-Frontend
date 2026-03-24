import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import { useDebounce } from "use-debounce";
import CategoryFormDialog from "app/views/projects/components/CategoryFormDialog";
import { useDeleteCategory, usePagedCategories } from "app/hooks/useCategories";
import { CATEGORY_VISIBILITY_COLOR, CATEGORY_VISIBILITY_LABEL } from "app/utils/constant";
import { ConfirmationDialog } from "app/components";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatScope(category) {
  if (category.visibility === "department") {
    return category.departmentName
      ? `${CATEGORY_VISIBILITY_LABEL.department}: ${category.departmentName}`
      : CATEGORY_VISIBILITY_LABEL.department;
  }
  return CATEGORY_VISIBILITY_LABEL[category.visibility] ?? category.visibility;
}

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [debouncedName] = useDebounce(name, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: paged, isLoading, isFetching } = usePagedCategories({
    name: debouncedName.trim() || undefined,
    page,
    pageSize,
    includeInactive: true,
    includePrivate: true,
    includeAllDepartments: true
  });
  const categories = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const deleteCategoryMutation = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter((item) => item.isActive).length,
    private: categories.filter((item) => item.visibility === "private").length
  }), [categories]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
  };

  const columns = useMemo(() => [
    {
      id: "categoryName",
      header: "Category",
      accessorKey: "categoryName",
      cell: ({ row }) => (
        <Typography variant="body2" fontWeight={600}>
          {row.original.categoryName}
        </Typography>
      ),
    },
    {
      id: "scope",
      header: "Scope",
      cell: ({ row }) => (
        <Chip
          label={formatScope(row.original)}
          size="small"
          color={CATEGORY_VISIBILITY_COLOR[row.original.visibility] ?? "default"}
          variant="outlined"
        />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Chip
          label={row.original.isActive ? "Active" : "Inactive"}
          size="small"
          color={row.original.isActive ? "success" : "default"}
          variant={row.original.isActive ? "filled" : "outlined"}
        />
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      cell: ({ row }) => formatDate(row.original.updatedAt ?? row.original.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Tooltip title="Edit category">
            <IconButton size="small" onClick={() => handleEdit(row.original)}>
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete category">
            <IconButton
              size="small"
              color="error"
              disabled={deleteCategoryMutation.isPending}
              onClick={() => setDeleteTarget(row.original)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }
  ], [deleteCategoryMutation.isPending]);

  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Category Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage global, department, and private project categories from one dedicated master-data screen.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          New Category
        </Button>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap">
        <Chip label={`${totalCount} Total`} variant="outlined" size="small" />
        <Chip label={`${stats.active} Active`} color="success" variant="outlined" size="small" />
        <Chip label={`${stats.private} Private`} color="warning" variant="outlined" size="small" />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            placeholder="Search category name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setPage(1);
            }}
            size="small"
            fullWidth
            sx={{ maxWidth: 420 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Showing {categories.length} on this page, {totalCount} total
          </Typography>
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : categories.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 10, textAlign: "center", borderRadius: 2.5 }}>
          <Typography variant="h6" color="text.secondary">
            No categories yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>
            Create your first category to organize projects by global, department, or private scope.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={handleCreate}>
            New Category
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, opacity: isFetching ? 0.7 : 1, transition: "opacity 0.2s" }}>
          <Table size="small">
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isFirst = index === 0;
                    const isLast = index === headerGroup.headers.length - 1;

                    return (
                      <TableCell
                        key={header.id}
                        align={header.column.columnDef.meta?.align ?? "left"}
                        sx={{
                          fontWeight: 700,
                          py: 1.25,
                          pl: isFirst ? 3 : 2,
                          pr: isLast ? 3 : 2,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                    const isFirst = index === 0;
                    const isLast = index === row.getVisibleCells().length - 1;

                    return (
                      <TableCell
                        key={cell.id}
                        align={cell.column.columnDef.meta?.align ?? "left"}
                        sx={{
                          py: 1.25,
                          pl: isFirst ? 3 : 2,
                          pr: isLast ? 3 : 2
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
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
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
          />
        </TableContainer>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        category={selectedCategory}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Category"
        text={`Delete category "${deleteTarget?.categoryName}"?`}
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteCategoryMutation.isPending}
        onConfirmDialogClose={() => setDeleteTarget(null)}
        onYesClick={() => {
          if (!deleteTarget) return;
          deleteCategoryMutation.mutate(deleteTarget.categoryId, {
            onSuccess: () => setDeleteTarget(null)
          });
        }}
      />
    </Box>
  );
}
