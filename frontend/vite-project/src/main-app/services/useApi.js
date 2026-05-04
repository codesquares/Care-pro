import { useState } from "react";
import api from "./api";
import config from "../config";

const useApi = (initialEndpoint = "", method = "get", options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (payload = null, customEndpoint = "", perCallOptions = {}) => {
    setLoading(true);
    setError(null); // Clear previous errors

    const finalEndpoint = customEndpoint || initialEndpoint;

    // Merge headers from hook-level options and per-call options. Per-call
    // headers take precedence (e.g. Idempotency-Key for signup submissions).
    const mergedHeaders = {
      ...(options.headers || {}),
      ...(perCallOptions.headers || {}),
    };

    try {
      const response = await api({
        url: `${config.BASE_URL}${finalEndpoint}`,
        method,
        data: payload,
        ...options,
        ...perCallOptions,
        headers: mergedHeaders,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred.";
      setError(errorMessage);
      // Preserve the original error (with response/status) for callers that
      // need to inspect status codes (e.g. idempotency 409/422 handling).
      const wrapped = new Error(errorMessage);
      wrapped.cause = err;
      wrapped.response = err.response;
      wrapped.status = err.response?.status;
      throw wrapped;
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, fetchData };
};

export default useApi;
