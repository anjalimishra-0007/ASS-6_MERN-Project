import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { studentApi } from '../api/studentApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const StudentFeesLedgerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentApi.getById(id);
      setLedgerData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch student fee ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading comprehensive student ledger..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchLedger} />;
  }

  if (!ledgerData) {
    return null;
  }

  const { student, summary, feeStructures } = ledgerData;

  return (
    <div>
      {/* Top Bar with Back Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/admin/students')}
          className="btn btn-outline btn-sm"
        >
          <ArrowLeft size={15} />
          Back to Students
        </button>

        <Link
          to={`/admin/payments/new?studentId=${student._id}`}
          className="btn btn-primary btn-sm"
        >
          <CreditCard size={15} />
          Collect Fee Payment
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#fff'
              }}
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.2rem' }}>
                {student.name}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>Roll: <strong style={{ color: '#38bdf8' }}>{student.rollNumber || 'N/A'}</strong></span>
                <span>•</span>
                <span>Course: <strong style={{ color: '#fff' }}>{student.course}</strong> (Sem {student.semester})</span>
                <span>•</span>
                <span>Email: {student.email}</span>
              </div>
            </div>
          </div>

          <div>
            <StatusBadge status={summary.overallStatus} />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Billed Dues</span>
            <span className="stat-value">₹{summary.totalBilled.toLocaleString('en-IN')}</span>
            <span className="stat-subtext">Tuition, lab, exam & late fees</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Amount Paid</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              ₹{summary.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">Verified collected receipts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Remaining Balance</span>
            <span className="stat-value" style={{ color: summary.totalPending > 0 ? '#f87171' : '#34d399' }}>
              ₹{summary.totalPending.toLocaleString('en-IN')}
            </span>
            <span className="stat-subtext">Pending clearance</span>
          </div>
        </div>
      </div>

      {/* Fee Structures Breakdown for Student */}
      <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
        Course Fee Structures & Receipts
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {feeStructures.map((fs) => (
          <div key={fs.feeStructure._id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.15rem', color: '#fff' }}>
                  {fs.feeStructure.course} — Semester {fs.feeStructure.semester}
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>Academic Year: {fs.feeStructure.academicYear}</span>
                  <span>•</span>
                  <span>Due Date: {new Date(fs.feeStructure.dueDate).toLocaleDateString()}</span>
                  {fs.lateFee > 0 && (
                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                      (Late Fee Applied: ₹{fs.lateFee})
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={fs.status} />
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                  Pending: <strong style={{ color: '#818cf8' }}>₹{fs.pendingAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Fee Heads */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                Fee Heads Inclusions
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {fs.feeStructure.feeHeads.map((head, idx) => (
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

            {/* Payments Made for this Fee Structure */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                Payments Credited ({fs.payments.length})
              </span>

              {fs.payments.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Payment Date</th>
                        <th>Mode</th>
                        <th>Transaction Ref</th>
                        <th>Amount Paid</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fs.payments.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <Link
                              to={`/receipts/${p.receiptNo}`}
                              style={{ color: '#818cf8', fontWeight: 600 }}
                            >
                              {p.receiptNo}
                            </Link>
                          </td>
                          <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td>
                            <span className="badge badge-mode">{p.paymentMode}</span>
                          </td>
                          <td>{p.transactionReference || 'N/A'}</td>
                          <td>
                            <strong style={{ color: '#34d399' }}>
                              ₹{p.amountPaid.toLocaleString('en-IN')}
                            </strong>
                          </td>
                          <td>
                            <Link
                              to={`/receipts/${p.receiptNo}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.5rem' }}
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
                  No payments made yet for this structure.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentFeesLedgerPage;
