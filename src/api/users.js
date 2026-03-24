import apiClient from "./client";

const getUsers = async (params) => {
  const response = await apiClient.get("/Users", { params });
  return response.data;
};

const getUserOptions = async (params) => {
  const response = await apiClient.get("/Users/options", { params });
  return response.data;
};

const getUser = async (id) => {
  const response = await apiClient.get(`/Users/${id}`);
  return response.data;
};

const createUser = async (data) => {
  const response = await apiClient.post("/Users", data);
  return response.data;
};

const updateUser = async (id, data) => {
  const response = await apiClient.put(`/Users/${id}`, data);
  return response.data;
};

const deleteUser = async (id) => {
  const response = await apiClient.delete(`/Users/${id}`);
  return response.data;
};

const resetUserPassword = async (id, data) => {
  const response = await apiClient.post(`/Users/${id}/reset-password`, data);
  return response.data;
};

export {
  getUsers,
  getUserOptions,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
};

