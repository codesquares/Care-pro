import { useState } from "react";
import api from "./api";
import config from "../config";

const useApi = (initialEndpoint = "", method = "get", options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (payload = null, customEndpoint = "") => {
    setLoading(true);
    setError(null); // Clear previous errors

    const finalEndpoint = customEndpoint || initialEndpoint;

    try {
      const response = await api({
        url: `${config.BASE_URL}${finalEndpoint}`,
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
