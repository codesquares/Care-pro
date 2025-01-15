import { useState } from "react";
import api from "./api";
import config from "../config";

const useApi = (endpoint, method = "get", options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (payload = null) => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await api({
        url: `${config.BASE_URL}${endpoint}`,
        method,
        data: payload,
        ...options,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred.";
      setError(errorMessage);
      throw new Error(errorMessage); // Rethrow the error
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, fetchData };
};

export default useApi;
