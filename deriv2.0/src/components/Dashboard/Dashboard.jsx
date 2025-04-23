import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const navigate = useNavigate();

  // Helper function to format dates in YYYY-MM-DD format
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRangeParams = (range) => {
    const now = new Date();
    const from = new Date();
    
    switch (range) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      default:
        from.setDate(now.getDate() - 30);
    }

    return {
      from: formatDate(from),
      to: formatDate(now)
    };
  };

  const fetchEarningsData = async () => {
    const token = localStorage.getItem('derivToken');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { from, to } = getDateRangeParams(dateRange);
      
      const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

      ws.onopen = () => {
        // First authorize the connection
        ws.send(JSON.stringify({
          authorize: token,
          req_id: Date.now()
        }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        // Handle authorization response
        if (data.authorize) {
          // After authorization, request the statement with properly formatted dates
          ws.send(JSON.stringify({
            statement: 1,
            description: 1,
            date_from: from,  // Already formatted correctly
            date_to: to,      // Already formatted correctly
            req_id: Date.now()
          }));
          return;
        }

        // Handle statement response
        if (data.statement) {
          const transactions = data.statement.transactions || [];
          const commissions = transactions.filter(t => t.action_type === 'commission');
          
          const totalCommission = commissions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
          const currentPeriodCommission = commissions
            .filter(t => new Date(t.transaction_time) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

          setEarningsData({
            totalCommission,
            currentPeriodCommission,
            transactions: commissions,
            lastUpdated: new Date().toLocaleString(),
            dateRange: `${from} to ${to}`
          });
          
          ws.close();
        }

        if (data.error) {
          setError(data.error.message);
          ws.close();
        }
      };

      ws.onerror = (err) => {
        setError('Failed to connect to Deriv API');
        ws.close();
      };

      const timeout = setTimeout(() => {
        ws.close();
        setError('Connection timeout. Please try again.');
        setLoading(false);
      }, 15000);

      ws.onclose = () => {
        clearTimeout(timeout);
        setLoading(false);
      };

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [dateRange, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('derivToken');
    localStorage.removeItem('accountInfo');
    navigate('/');
  };

  if (loading) return <div className={styles.loading}>Loading commission data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Deriv Commissions Dashboard</h1>
          <p className={styles.subtitle}>Date range: {earningsData?.dateRange || ''}</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.dateFilters}>
        <button 
          className={`${styles.dateFilter} ${dateRange === '7d' ? styles.active : ''}`}
          onClick={() => setDateRange('7d')}
        >
          7 Days
        </button>
        <button 
          className={`${styles.dateFilter} ${dateRange === '30d' ? styles.active : ''}`}
          onClick={() => setDateRange('30d')}
        >
          30 Days
        </button>
        <button 
          className={`${styles.dateFilter} ${dateRange === '90d' ? styles.active : ''}`}
          onClick={() => setDateRange('90d')}
        >
          90 Days
        </button>
      </div>

      {earningsData && (
        <div className={styles.earningsContainer}>
          <div className={styles.earningsCard}>
            <h3>Current Period</h3>
            <div className={styles.earningsRow}>
              <span>Commission:</span>
              <span className={styles.positive}>
                ${earningsData.currentPeriodCommission.toFixed(2)}
              </span>
            </div>
            <div className={styles.earningsRow}>
              <span>Transactions:</span>
              <span>{earningsData.transactions.length}</span>
            </div>
          </div>

          <div className={styles.earningsCard}>
            <h3>All Time</h3>
            <div className={styles.earningsRow}>
              <span>Total Commission:</span>
              <span className={styles.positive}>
                ${earningsData.totalCommission.toFixed(2)}
              </span>
            </div>
            <div className={styles.earningsRow}>
              <span>Last Updated:</span>
              <span>{earningsData.lastUpdated}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.transactionsContainer}>
        <h3>Recent Commission Transactions</h3>
        {earningsData?.transactions.length > 0 ? (
          <table className={styles.transactionsTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {earningsData.transactions.slice(0, 10).map((txn, index) => (
                <tr key={index}>
                  <td>{new Date(txn.transaction_time).toLocaleDateString()}</td>
                  <td className={styles.positive}>${Math.abs(parseFloat(txn.amount)).toFixed(2)}</td>
                  <td>{txn.longcode || txn.action_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No commission transactions found for this period.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;