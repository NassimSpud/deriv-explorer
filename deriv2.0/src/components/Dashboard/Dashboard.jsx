import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [data, setData] = useState({
    commissions: [],
    summary: { total: 0, count: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [customDates, setCustomDates] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const navigate = useNavigate();

  const fetchCommissions = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('derivToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/deriv-commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          date_from: formatDate(startDate),
          date_to: formatDate(endDate)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'custom':
        return; // Custom dates handled separately
      default:
        startDate.setDate(now.getDate() - 30);
    }

    fetchCommissions(startDate, now);
  };

  const handleCustomDateSubmit = () => {
    setDateRange('custom');
    fetchCommissions(customDates.start, customDates.end);
  };

  const handleLogout = () => {
    localStorage.removeItem('derivToken');
    navigate('/login');
  };

  useEffect(() => {
    handleDateRangeChange('30d');
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading commission data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button 
          onClick={() => handleDateRangeChange(dateRange)}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Deriv Broker Commissions</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.dateFilters}>
          <button
            className={`${styles.filterButton} ${dateRange === '7d' ? styles.active : ''}`}
            onClick={() => handleDateRangeChange('7d')}
          >
            7 Days
          </button>
          <button
            className={`${styles.filterButton} ${dateRange === '30d' ? styles.active : ''}`}
            onClick={() => handleDateRangeChange('30d')}
          >
            30 Days
          </button>
          <button
            className={`${styles.filterButton} ${dateRange === '90d' ? styles.active : ''}`}
            onClick={() => handleDateRangeChange('90d')}
          >
            90 Days
          </button>
        </div>

        <div className={styles.customRange}>
          <DatePicker
            selected={customDates.start}
            onChange={(date) => setCustomDates({...customDates, start: date})}
            selectsStart
            startDate={customDates.start}
            endDate={customDates.end}
            maxDate={new Date()}
            className={styles.dateInput}
          />
          <span>to</span>
          <DatePicker
            selected={customDates.end}
            onChange={(date) => setCustomDates({...customDates, end: date})}
            selectsEnd
            startDate={customDates.start}
            endDate={customDates.end}
            minDate={customDates.start}
            maxDate={new Date()}
            className={styles.dateInput}
          />
          <button
            onClick={handleCustomDateSubmit}
            className={styles.applyButton}
          >
            Apply
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <h3>Total Commissions</h3>
          <p className={styles.amount}>${data.summary.total.toFixed(2)}</p>
          <p>{data.summary.count} transactions</p>
        </div>
        <div className={styles.card}>
          <h3>Date Range</h3>
          <p>{new Date(data.summary.date_range.start).toLocaleDateString()}</p>
          <p>to</p>
          <p>{new Date(data.summary.date_range.end).toLocaleDateString()}</p>
        </div>
      </div>

      <div className={styles.commissionsTable}>
        <h2>Commission Details</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {data.commissions.map((commission, index) => (
              <tr key={index}>
                <td>{new Date(commission.date).toLocaleDateString()}</td>
                <td className={styles.amount}>${commission.amount.toFixed(2)}</td>
                <td>{commission.description}</td>
                <td className={styles.reference}>{commission.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;