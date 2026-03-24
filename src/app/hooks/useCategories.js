import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { createCategory, deleteCategory, getCategories, getPagedCategories, updateCategory } from "/src/api/categories";

export const CATEGORY_KEYS = {
  all: ["categories"],
  filtered: (params) => ["categories", params],
  paged: (params) => ["categories", "paged", params],
};

export const useCategories = (params = {}, options = {}) =>
  useQuery({
    queryKey: CATEGORY_KEYS.filtered(params),
    queryFn: () => getCategories(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
    ...options,
  });

export const usePagedCategories = (params = {}, options = {}) =>
  useQuery({
    queryKey: CATEGORY_KEYS.paged(params),
    queryFn: () => getPagedCategories(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 30_000,
    ...options,
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      enqueueSnackbar(res?.message || "Category created successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to create category", { variant: "error" });
    },
  });
};

export const useUpdateCategory = (categoryId) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data) => updateCategory(categoryId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      enqueueSnackbar(res?.message || "Category updated successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to update category", { variant: "error" });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      enqueueSnackbar(res?.message || "Category deleted successfully", { variant: "success" });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || "Failed to delete category", { variant: "error" });
    },
  });
};

