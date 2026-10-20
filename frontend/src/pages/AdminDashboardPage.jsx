import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
  Calendar,
  ArrowRight,
  Receipt,
  FileCheck
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getStats();
      setStats(res.stats);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating real-time financial metrics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  if (!stats) {
    return <EmptyState title="No Dashboard Data Available" />;
  }

  const {
    totalCollected,
    totalBilled,
    totalPending,
    totalStudents,
    statusSummary,
    modeWiseCollection,
    overdueDefaulters,
    recentPayments
  } = stats;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '0.25rem' }}>
            Financial Overview & Collections
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live fee records, payment modes, and student dues tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/payments/new" className="btn btn-primary btn-sm">
            <CreditCard size={15} />
            Record Payment
          </Link>
          <Link to="/admin/fees/new" className="btn btn-secondary btn-sm">
            <FileCheck size={15} />
            New Fee Structure
          </Link>
        </div>
      </div>

      {/* Primary Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Fee Collected</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">Received into institutional account</span>
          </div>
          <div className="stat-icon green">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Fee Pending</span>
            <span className="stat-value" style={{ color: '#f87171' }}>
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">Unsettled outstanding balance</span>
          </div>
          <div className="stat-icon red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Fee Billed</span>
            <span className="stat-value">₹{totalBilled.toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Across enrolled course structures</span>
          </div>
          <div className="stat-icon">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Enrolled Students</span>
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-subtext">
              {statusSummary?.paid || 0} Paid • {statusSummary?.partiallyPaid || 0} Partial • {statusSummary?.unpaid || 0} Unpaid
            </span>
          </div>
          <div className="stat-icon cyan">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Middle Row: Mode-wise Collection & Status Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Mode-wise Collection Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="#6366f1" />
              <span>Mode-wise Collections</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              All Time
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {modeWiseCollection?.map((item) => {
              const percentage = totalCollected > 0 ? ((item.totalAmount / totalCollected) * 100).toFixed(1) : 0;
              return (
                <div key={item.mode}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{item.mode} ({item.count} txns)</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>
                      ₹{item.totalAmount.toLocaleString('en-IN')}{' '}
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        ({percentage}%)
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'var(--bg-surface)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background:
                          item.mode === 'UPI'
                            ? '#06b6d4'
                            : item.mode === 'Card'
                            ? '#a855f7'
                            : item.mode === 'Cash'
                            ? '#10b981'
                            : '#6366f1',
                        borderRadius: '3px'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Fee Clearance Status Overview */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#10b981" />
              <span>Student Clearance Status</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399', display: 'block' }}>
                {statusSummary?.paid || 0}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fully Cleared</span>
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', display: 'block' }}>
                {statusSummary?.partiallyPaid || 0}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Partially Paid</span>
            </div>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', display: 'block' }}>
                {statusSummary?.unpaid || 0}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unpaid / Zero</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/admin/students" className="btn btn-outline btn-sm">
              <Users size={14} />
              View All Student Accounts
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Defaulters List */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} color="#ef4444" />
            <span>Overdue Defaulters List</span>
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px'
              }}
            >
              {overdueDefaulters?.length || 0} Students
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Due date passed with outstanding balance
          </span>
        </div>

        {overdueDefaulters && overdueDefaulters.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Course / Sem</th>
                  <th>Contact</th>
                  <th>Days Overdue</th>
                  <th>Overdue Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueDefaulters.map((def) => (
                  <tr key={def.studentId}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#38bdf8' }}>{def.rollNumber}</span>
                    </td>
                    <td>{def.name}</td>
                    <td>{def.course} (Sem {def.semester})</td>
                    <td>{def.phone}</td>
                    <td>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>
                        {def.daysOverdue} days
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>
                        ₹{def.overdueAmount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/admin/students/${def.studentId}/fees`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.6rem' }}
                        >
                          Ledger
                        </Link>
                        <Link
                          to={`/admin/payments/new?studentId=${def.studentId}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.25rem 0.6rem' }}
                        >
                          Collect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No overdue defaulters! All active due dates are honored.
          </p>
        )}
      </div>

      {/* Recent Payments Stream */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Receipt size={18} color="#6366f1" />
            <span>Recent Payment Transactions</span>
          </div>
        </div>

        {recentPayments && recentPayments.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Course</th>
                  <th>Payment Mode</th>
                  <th>Amount Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <Link
                        to={`/receipts/${p.receiptNo}`}
                        style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Receipt size={14} />
                        {p.receiptNo}
                      </Link>
                    </td>
                    <td>{p.student?.name}</td>
                    <td>{p.student?.rollNumber}</td>
                    <td>{p.student?.course}</td>
                    <td>
                      <span className="badge badge-mode">{p.paymentMode}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>
                        ₹{p.amountPaid.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/receipts/${p.receiptNo}`}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        View Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', padding: '1.5rem 0', textAlign: 'center' }}>
            No payments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
