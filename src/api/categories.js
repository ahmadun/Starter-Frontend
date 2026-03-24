import apiClient from "./client";

const getCategories = async (params) => {
  const response = await apiClient.get("/categories", { params });
  return response.data;
};

const getPagedCategories = async (params) => {
  const response = await apiClient.get("/categories/paged", { params });
  return response.data;
};

const getCategory = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data;
};

const createCategory = async (data) => {
  const response = await apiClient.post("/categories", data);
  return response.data;
};

const updateCategory = async (id, data) => {
  const response = await apiClient.put(`/categories/${id}`, data);
  return response.data;
};

const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};

export { getCategories, getPagedCategories, getCategory, createCategory, updateCategory, deleteCategory };

