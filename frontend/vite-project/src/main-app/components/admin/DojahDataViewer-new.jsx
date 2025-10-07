import { useState } from 'react';
import { getAllWebhookData, getWebhookStatistics } from '../../services/dojahService';
import styles from './DojahDataViewer.module.css';

const DojahDataViewer = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('statistics'); // 'statistics' or 'data'

  const token = localStorage.getItem('authToken');

  const loadData = async (type) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (type === 'statistics') {
        response = await getWebhookStatistics(token);
        setData({ type: 'statistics', ...response });
      } else {
        response = await getAllWebhookData(token);
        setData({ type: 'data', ...response });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    loadData(newView);
  };

  React.useEffect(() => {
    loadData('statistics');
  }, []);
  console.log("dataviewer", data);

  return (
    <div className={styles.dojahDataViewer}>
      <div className={styles.viewerHeader}>
        <h3>Dojah Webhook Data</h3>
        <div className={styles.viewTabs}>
          <button 
            className={view === 'statistics' ? 'active' : ''} 
            onClick={() => handleViewChange('statistics')}
          >
            Statistics
          </button>
          <button 
            className={view === 'data' ? 'active' : ''} 
            onClick={() => handleViewChange('data')}
          >
            All Data
          </button>
        </div>
        <button onClick={onClose} className={styles.closeBtn}>×</button>
      </div>

      <div className={styles.viewerContent}>
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>Error: {error}</div>}

        {data && !loading && !error && (
          <div className="data-display">
            {data.type === 'statistics' && (
              <div className="statistics-view">
                <div className={styles.statsGrid}>
                  {Object.entries(data.statistics).map(([key, value]) => (
                    <div key={key} className={styles.statItem}>
                      <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.type === 'data' && (
              <div className="raw-data-view">
                <div className={styles.dataSummary}>
                  <p><strong>Total Records:</strong> {data.metadata?.totalRecords || 0}</p>
                  <p><strong>Retrieved At:</strong> {data.metadata?.retrievedAt}</p>
                </div>
                <div className="data-list">
                  {data.data.map((item, index) => (
                    <div key={index} className={styles.dataItem}>
                      <div className={styles.itemHeader}>
                        <strong>User ID: {item.userId}</strong>
                        <span className={styles.timestamp}>
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.itemDetails}>
                        <p><strong>Status:</strong> {item.webhookData.event}</p>
                        <p><strong>Expires in:</strong> {item.expiresIn} hours</p>
                        <details>
                          <summary>View Raw Data</summary>
                          <pre className={styles.jsonData}>
                            {JSON.stringify(item.webhookData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DojahDataViewer;
