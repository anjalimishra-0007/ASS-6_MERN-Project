import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, User, Layers, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { studentApi } from '../api/studentApi.js';
import { paymentApi } from '../api/paymentApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const RecordPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId);
  const [studentDetails, setStudentDetails] = useState(null);
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState('');

  // Payment Form Fields
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch all students for the dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await studentApi.getAll();
        setStudents(res.data);
      } catch (err) {
        setError('Failed to fetch students roster');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // 2. When student is selected, fetch their detailed fee structures & standing
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetails(null);
      setSelectedFeeStructureId('');
      return;
    }

    const fetchStudentFeeDetails = async () => {
      setStudentLoading(true);
      try {
        const res = await studentApi.getById(selectedStudentId);
        setStudentDetails(res.data);
        // Default to first fee structure that has pending balance, or first available
        const pendingOne = res.data.feeStructures.find((fs) => fs.pendingAmount > 0);
        if (pendingOne) {
          setSelectedFeeStructureId(pendingOne.feeStructure._id);
        } else if (res.data.feeStructures.length > 0) {
          setSelectedFeeStructureId(res.data.feeStructures[0].feeStructure._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch student fee details');
      } finally {
        setStudentLoading(false);
      }
    };

    fetchStudentFeeDetails();
  }, [selectedStudentId]);

  // Current selected fee structure details
  const activeStructure = studentDetails?.feeStructures?.find(
    (fs) => fs.feeStructure._id === selectedFeeStructureId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);

    // Frontend validation mirroring backend business rules
    if (!numericAmount || numericAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (activeStructure && numericAmount > activeStructure.pendingAmount) {
      setError(
        `Payment amount (₹${numericAmount.toLocaleString('en-IN')}) cannot exceed the pending balance of ₹${activeStructure.pendingAmount.toLocaleString('en-IN')}.`
      );
      return;
    }

    if (!selectedStudentId || !selectedFeeStructureId) {
      setError('Please select both a student and a fee structure.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentApi.recordPayment({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructureId,
        amount: numericAmount,
        paymentMode,
        paymentDate,
        transactionReference,
        remarks
      });

      // Navigate to generated receipt page!
      navigate(`/receipts/${res.data.receiptNo}`);
    } catch (err) {
      setError(err.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing payment collection interface..." />;
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.2rem' }}>
          Record Student Fee Payment
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Verify dues, accept partial/full payments, and auto-generate verifiable receipts
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Student */}
          <div className="form-group">
            <label className="form-label">
              <User size={15} style={{ display: 'inline', marginRight: '4px' }} />
              Select Student *
            </label>
            <select
              className="form-control"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              <option value="">-- Choose Student from Enrolled Roster --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.rollNumber || 'No Roll'}) — {s.course} (Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          {studentLoading && (
            <div style={{ padding: '1rem 0' }}>
              <LoadingSpinner message="Loading student fee ledger..." />
            </div>
          )}

          {/* Step 2: Select Fee Structure & Review Balance */}
          {studentDetails && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Layers size={15} style={{ display: 'inline', marginRight: '4px' }} />
                  Fee Structure for Payment *
                </label>
                <select
                  className="form-control"
                  value={selectedFeeStructureId}
                  onChange={(e) => setSelectedFeeStructureId(e.target.value)}
                  required
                >
                  {studentDetails.feeStructures.map((fs) => (
                    <option key={fs.feeStructure._id} value={fs.feeStructure._id}>
                      {fs.feeStructure.course} (Sem {fs.feeStructure.semester}) - {fs.feeStructure.academicYear} | Pending: ₹{fs.pendingAmount.toLocaleString('en-IN')} [{fs.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Due Balance Breakdown Card */}
              {activeStructure && (
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    margin: '1.25rem 0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Base Fee
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                      ₹{activeStructure.totalBaseFee.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Late Fee (Overdue)
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: activeStructure.lateFee > 0 ? '#f87171' : '#34d399' }}>
                      +₹{activeStructure.lateFee.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Total Already Paid
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>
                      ₹{activeStructure.totalPaid.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Current Balance Due
                    </span>
                    <strong style={{ fontSize: '1.25rem', color: '#818cf8', fontFamily: 'var(--font-display)' }}>
                      ₹{activeStructure.pendingAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Current Status
                    </span>
                    <StatusBadge status={activeStructure.status} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Payment Particulars */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount to Collect (₹) *</label>
              <input
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder={activeStructure ? `Max ₹${activeStructure.pendingAmount}` : 'Enter amount in INR'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {activeStructure && (
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                    onClick={() => setAmount(activeStructure.pendingAmount)}
                  >
                    Pay Full Due (₹{activeStructure.pendingAmount})
                  </button>
                  {activeStructure.pendingAmount > 10000 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
                      onClick={() => setAmount(Math.round(activeStructure.pendingAmount / 2))}
                    >
                      Pay 50%
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                className="form-control"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                <option value="Card">Debit / Credit Card (POS Counter)</option>
                <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                <option value="Cash">Cash Deposit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-control"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transaction Reference / UTR / Cheque No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. UPI-9923847291 or CASH-002"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks / Note</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Semester 1 installment"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (activeStructure && activeStructure.pendingAmount <= 0)}
            >
              <CreditCard size={16} />
              <span>{submitting ? 'Recording & Generating Receipt...' : 'Confirm & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentPage;
