import { useState, useEffect } from 'react';
import { getAllWebhookData, getWebhookStatistics } from '../services/dojahService';

export const useDojahAdmin = () => {
  const [webhookData, setWebhookData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('authToken');

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [allDataResponse, statsResponse] = await Promise.all([
        getAllWebhookData(token),
        getWebhookStatistics(token)
      ]);

      setWebhookData(allDataResponse.data || []);
      setStatistics(statsResponse.statistics);
    } catch (err) {
      setError(err.message);
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getWebhookStatistics(token);
      setStatistics(response.statistics);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshData = () => {
    return loadAllData();
  };

  return {
    webhookData,
    statistics,
    loading,
    error,
    loadAllData,
    loadStatistics,
    refreshData
  };
};

export default useDojahAdmin;
