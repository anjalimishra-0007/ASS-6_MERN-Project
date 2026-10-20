import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Search, Filter } from 'lucide-react';
import { feeStructureApi } from '../api/feeStructureApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const FeeStructureListPage = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Use URL search params for bonus requirement
  const [searchParams, setSearchParams] = useSearchParams();
  const courseFilter = searchParams.get('course') || '';
  const semesterFilter = searchParams.get('semester') || '';

  const fetchFeeStructures = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (courseFilter) params.course = courseFilter;
      if (semesterFilter) params.semester = semesterFilter;

      const res = await feeStructureApi.getAll(params);
      setFeeStructures(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, [courseFilter, semesterFilter]);

  const handleDelete = async (id, courseName) => {
    if (!window.confirm(`Are you sure you want to delete fee structure for ${courseName}?`)) {
      return;
    }
    setActionError('');
    try {
      await feeStructureApi.delete(id);
      setFeeStructures(feeStructures.filter((item) => item._id !== id));
    } catch (err) {
      setActionError(err.message || 'Failed to delete fee structure');
    }
  };

  const handleFilterChange = (key, value) => {
    const updated = new URLSearchParams(searchParams);
    if (value) {
      updated.set(key, value);
    } else {
      updated.delete(key);
    }
    setSearchParams(updated);
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.2rem' }}>
            Course Fee Structures
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage fee heads, semester amounts, and due dates across academic programs
          </p>
        </div>
        <Link to="/admin/fees/new" className="btn btn-primary">
          <Plus size={16} />
          Create New Fee Structure
        </Link>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {/* Filters (with useSearchParams) */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by:</span>
          </div>

          <div style={{ flex: '1', minWidth: '180px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Course name..."
              value={courseFilter}
              onChange={(e) => handleFilterChange('course', e.target.value)}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="form-control"
              value={semesterFilter}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {(courseFilter || semesterFilter) && (
            <button
              onClick={() => setSearchParams({})}
              className="btn btn-outline btn-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content States */}
      {loading ? (
        <LoadingSpinner message="Loading course fee structures..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchFeeStructures} />
      ) : feeStructures.length === 0 ? (
        <EmptyState
          title="No Fee Structures Found"
          description="No fee structures match your search criteria. Create one to begin collecting payments."
          action={
            <Link to="/admin/fees/new" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Add First Structure
            </Link>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {feeStructures.map((fs) => (
            <div key={fs._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.2rem' }}>
                    {fs.course}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Sem {fs.semester}</span>
                    <span>•</span>
                    <span>{fs.academicYear}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: '#818cf8',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    ₹{fs.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Fee Heads Breakdown Chips */}
              <div style={{ flex: '1', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-dim)',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  Fee Heads Breakdown ({fs.feeHeads?.length || 0})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {fs.feeHeads?.map((head, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {head.headName}:{' '}
                      <strong style={{ color: '#fff' }}>₹{head.amount?.toLocaleString('en-IN')}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Due Date & Late Fee Info */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#f59e0b" />
                  <span>
                    Due: <strong>{new Date(fs.dueDate).toLocaleDateString()}</strong>
                  </span>
                </div>
                <span>Late Fee: ₹{fs.lateFeePerDay}/day</span>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.85rem'
                }}
              >
                <Link
                  to={`/admin/fees/${fs._id}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  <Edit2 size={13} />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(fs._id, fs.course)}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeeStructureListPage;
