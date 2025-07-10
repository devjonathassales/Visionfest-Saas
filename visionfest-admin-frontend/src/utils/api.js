import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api", // Porta do backend admin
});

export default api;
