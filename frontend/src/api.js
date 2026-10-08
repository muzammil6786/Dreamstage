import axios from "axios";
const api = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "https://dreamstage-3heh.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ds_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;