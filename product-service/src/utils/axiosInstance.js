// utils/axiosInstance.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export function axiosInstance(token) {
  return axios.create({
    baseURL: process.env.API_GATEWAY_IDENTITY_SERVICE_URL,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
export default axiosInstance;
