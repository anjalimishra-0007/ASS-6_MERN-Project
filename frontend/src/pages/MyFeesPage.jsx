import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { paymentApi } from '../api/paymentApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

const MyFeesPage = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyFees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentApi.getStudentSummary();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve fee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFees();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Fetching your fee ledger and payment history..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMyFees} />;
  }

  if (!data) {
    return <EmptyState title="No Student Fee Profile Found" />;
  }

  const { student, summary, structures } = data;

  return (
    <div>
      {/* Student Welcome Header Card */}
      <div
        className="card"
        style={{
          background: 'var(--accent-card-gradient)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <UserCheck size={18} color="#818cf8" />
              <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                STUDENT FINANCIAL PORTAL
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '0.25rem' }}>
              Welcome, {student.name}
            </h1>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>Roll: <strong style={{ color: '#38bdf8' }}>{student.rollNumber || 'N/A'}</strong></span>
              <span>•</span>
              <span>Program: <strong style={{ color: '#fff' }}>{student.course}</strong> (Semester {student.semester})</span>
              <span>•</span>
              <span>Email: {student.email}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Account Standing
            </span>
            <StatusBadge status={summary.overallStatus} />
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Fee Incurred</span>
            <span className="stat-value">₹{summary.totalBilled.toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Tuition, lab, exam & resources</span>
          </div>
          <div className="stat-icon">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Amount Paid</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              ₹{summary.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">Receipts cleared</span>
          </div>
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Pending Due</span>
            <span className="stat-value" style={{ color: summary.totalPending > 0 ? '#f87171' : '#34d399' }}>
              ₹{summary.totalPending.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">
              {summary.totalPending === 0 ? 'All fees settled' : 'Payment required'}
            </span>
          </div>
          <div className="stat-icon red">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Structures & Payment History */}
      <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '1.25rem' }}>
        Program Fee Structures & Issued Receipts
      </h2>

      {structures.length === 0 ? (
        <EmptyState
          title="No Fee Structures Assigned"
          description="There are currently no fee structures configured for your course."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {structures.map((item) => (
            <div key={item.feeStructure._id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                    {item.feeStructure.course} — Semester {item.feeStructure.semester}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>Academic Year: {item.feeStructure.academicYear}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} color="#f59e0b" />
                      Due Date: <strong>{new Date(item.feeStructure.dueDate).toLocaleDateString()}</strong>
                    </span>
                    {item.lateFee > 0 && (
                      <span style={{ color: '#f87171', fontWeight: 600 }}>
                        (Late Fee: ₹{item.lateFee})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={item.status} />
                  <div style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                    Pending Balance: <strong style={{ color: '#818cf8' }}>₹{item.pendingAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Fee Heads List */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '0.4rem'
                  }}
                >
                  Fee Components & Heads
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {item.feeStructure.feeHeads.map((head, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {head.headName}: <strong>₹{head.amount.toLocaleString('en-IN')}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Receipts Table */}
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '0.4rem'
                  }}
                >
                  Issued Payment Receipts ({item.payments.length})
                </span>

                {item.payments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Receipt Number</th>
                          <th>Date Paid</th>
                          <th>Payment Mode</th>
                          <th>Reference / UTR</th>
                          <th>Amount Paid</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.payments.map((p) => (
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
                            <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td>
                              <span className="badge badge-mode">{p.paymentMode}</span>
                            </td>
                            <td>{p.transactionReference || 'Direct Deposit'}</td>
                            <td>
                              <strong style={{ color: '#34d399' }}>
                                ₹{p.amountPaid.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td>
                              <Link
                                to={`/receipts/${p.receiptNo}`}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '0.2rem 0.55rem' }}
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
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No payment receipts generated yet. Please visit the accounts counter or contact administration.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFeesPage;
