import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  Download
} from 'lucide-react';
import { paymentApi } from '../api/paymentApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const ReceiptDetailPage = ({ user }) => {
  const { receiptNo } = useParams();
  const navigate = useNavigate();

  const [receiptData, setReceiptData] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReceipt = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentApi.getPaymentByReceiptNo(receiptNo);
      setReceiptData(res.data);
      setFeeSummary(res.feeSummary);
    } catch (err) {
      setError(err.message || 'Failed to retrieve payment receipt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptNo]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving verifiable payment receipt..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <ErrorMessage message={error} />
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/my-fees')}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '1rem' }}
        >
          <ArrowLeft size={14} />
          Return to Portal
        </button>
      </div>
    );
  }

  if (!receiptData) return null;

  const { student, feeStructure, amountPaid, lateFeeIncluded, paymentMode, paymentDate, transactionReference, recordedBy, remarks } = receiptData;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Action Bar (hidden on print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-sm"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            Print Official Receipt
          </button>
        </div>
      </div>

      {/* Official Printable Receipt Canvas */}
      <div className="receipt-paper">
        {/* Header */}
        <div className="receipt-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={24} color="#312e81" />
              <h1 className="receipt-institute-title">APEX INSTITUTE OF TECHNOLOGY & SCIENCE</h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Affiliated to State University • Directorate of Higher Education
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Campus Road, Knowledge Park II, New Delhi - 110001
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="receipt-stamp">PAID & VERIFIED</div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: '#475569' }}>
              <div><strong>Receipt No:</strong> {receiptNo}</div>
              <div><strong>Date:</strong> {new Date(paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Student Particulars Grid */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.875rem'
          }}
        >
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Student Name</span>
            <strong style={{ color: '#0f172a' }}>{student?.name}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Roll Number</span>
            <strong style={{ color: '#0f172a' }}>{student?.rollNumber || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Course / Program</span>
            <strong style={{ color: '#0f172a' }}>{student?.course} (Sem {student?.semester})</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Academic Session</span>
            <strong style={{ color: '#0f172a' }}>{feeStructure?.academicYear}</strong>
          </div>
        </div>

        {/* Breakdown of Fee Heads & Payments */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Description / Fee Head</th>
              <th style={{ textAlign: 'right' }}>Assessed Amount</th>
            </tr>
          </thead>
          <tbody>
            {feeStructure?.feeHeads?.map((head, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{head.headName}</td>
                <td style={{ textAlign: 'right' }}>₹{head.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {lateFeeIncluded > 0 && (
              <tr style={{ color: '#dc2626' }}>
                <td>-</td>
                <td>Late Fee Surcharge (Overdue penalty)</td>
                <td style={{ textAlign: 'right' }}>₹{lateFeeIncluded.toLocaleString('en-IN')}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" style={{ textAlign: 'right' }}>Total Fee Payable:</td>
              <td style={{ textAlign: 'right' }}>
                ₹{((feeStructure?.totalAmount || 0) + (lateFeeIncluded || 0)).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr style={{ background: '#f0fdf4' }}>
              <td colSpan="2" style={{ textAlign: 'right', color: '#15803d', fontSize: '1.05rem' }}>
                AMOUNT PAID IN THIS TRANSACTION:
              </td>
              <td style={{ textAlign: 'right', color: '#15803d', fontSize: '1.15rem', fontWeight: 800 }}>
                ₹{amountPaid.toLocaleString('en-IN')}
              </td>
            </tr>
            {feeSummary && (
              <tr>
                <td colSpan="2" style={{ textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>
                  Remaining Balance Pending Clearance:
                </td>
                <td style={{ textAlign: 'right', color: feeSummary.pendingAmount > 0 ? '#b91c1c' : '#15803d', fontSize: '0.95rem' }}>
                  ₹{feeSummary.pendingAmount.toLocaleString('en-IN')} ({feeSummary.status})
                </td>
              </tr>
            )}
          </tfoot>
        </table>

        {/* Transaction Metadata */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.825rem',
            color: '#475569'
          }}
        >
          <div>
            <strong>Payment Mode:</strong> {paymentMode}
          </div>
          <div>
            <strong>Reference / UTR:</strong> {transactionReference || 'N/A'}
          </div>
          <div>
            <strong>Cashier / Issuer:</strong> {recordedBy?.name || 'Accounts Admin'}
          </div>
          <div>
            <strong>Note:</strong> {remarks}
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '2px dashed #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.8rem' }}>
            <ShieldCheck size={18} />
            <span>Computer-generated official receipt. Valid without physical signature.</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '40px', width: '160px', borderBottom: '1px solid #0f172a', margin: '0 auto 0.4rem auto' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
              Authorized Finance Officer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
