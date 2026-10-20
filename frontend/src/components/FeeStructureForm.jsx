import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Layers } from 'lucide-react';
import ErrorMessage from './ErrorMessage.jsx';

const DEFAULT_HEADS = [
  { headName: 'Tuition Fee', amount: 45000 },
  { headName: 'Examination Fee', amount: 5000 },
  { headName: 'Library & Tech Resources', amount: 3000 }
];

const FeeStructureForm = ({ initialData, onSubmit, isSubmitting, title = 'Fee Structure Form' }) => {
  const navigate = useNavigate();
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [lateFeePerDay, setLateFeePerDay] = useState(50);
  const [remarks, setRemarks] = useState('');
  const [feeHeads, setFeeHeads] = useState(DEFAULT_HEADS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCourse(initialData.course || '');
      setAcademicYear(initialData.academicYear || '2025-2026');
      setSemester(initialData.semester || 1);
      if (initialData.dueDate) {
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
      }
      setLateFeePerDay(initialData.lateFeePerDay ?? 50);
      setRemarks(initialData.remarks || '');
      if (initialData.feeHeads && initialData.feeHeads.length > 0) {
        setFeeHeads(initialData.feeHeads.map((h) => ({ headName: h.headName, amount: h.amount })));
      }
    }
  }, [initialData]);

  // Compute total fee amount dynamically
  const totalAmount = feeHeads.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

  const handleHeadChange = (index, field, value) => {
    const updated = [...feeHeads];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? Number(value) || 0 : value
    };
    setFeeHeads(updated);
  };

  const handleAddHead = () => {
    setFeeHeads([...feeHeads, { headName: '', amount: 0 }]);
  };

  const handleRemoveHead = (index) => {
    if (feeHeads.length <= 1) {
      setError('A fee structure must have at least one fee head.');
      return;
    }
    setError('');
    setFeeHeads(feeHeads.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!course.trim()) {
      setError('Please provide course name (e.g., B.Tech CSE).');
      return;
    }
    if (!dueDate) {
      setError('Please specify a due date for payment.');
      return;
    }

    for (const h of feeHeads) {
      if (!h.headName.trim()) {
        setError('All fee head names must be specified.');
        return;
      }
      if (h.amount < 0) {
        setError('Fee head amounts cannot be negative.');
        return;
      }
    }

    try {
      await onSubmit({
        course: course.trim(),
        academicYear: academicYear.trim(),
        semester: Number(semester),
        feeHeads,
        totalAmount,
        dueDate,
        lateFeePerDay: Number(lateFeePerDay),
        remarks
      });
    } catch (err) {
      setError(err.message || 'Failed to save fee structure');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card-header">
        <div className="card-title">
          <Layers size={22} color="#6366f1" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/fees')}
          className="btn btn-outline btn-sm"
        >
          <ArrowLeft size={15} />
          Back to List
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Course Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. B.Tech CSE, BCA, BBA"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 2025-2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Semester *</label>
            <select
              className="form-control"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fee Payment Due Date *</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Late Fee Per Overdue Day (₹)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={lateFeePerDay}
              onChange={(e) => setLateFeePerDay(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Fee Heads Section */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}
          >
            <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>Fee Heads Breakdown</h4>
            <button
              type="button"
              onClick={handleAddHead}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              Add Head
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {feeHeads.map((head, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 42px',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Head name (e.g. Tuition, Exam, Lab, Transport)"
                  value={head.headName}
                  onChange={(e) => handleHeadChange(idx, 'headName', e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Amount (₹)"
                  value={head.amount}
                  onChange={(e) => handleHeadChange(idx, 'amount', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHead(idx)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.65rem', width: '38px', height: '38px' }}
                  title="Remove Head"
                  disabled={feeHeads.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Computed Total Banner */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
              Auto-Computed Total Fee:
            </span>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#818cf8',
                fontFamily: 'var(--font-display)'
              }}
            >
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Remarks / Instructions (Optional)</label>
          <textarea
            className="form-control"
            rows="2"
            placeholder="Special instructions or notes for this fee structure..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/admin/fees')}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <Save size={16} />
            <span>{isSubmitting ? 'Saving Fee Structure...' : 'Save Fee Structure'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeeStructureForm;
