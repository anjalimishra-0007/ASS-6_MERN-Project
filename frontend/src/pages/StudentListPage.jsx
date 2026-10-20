import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Search, CreditCard, FileText, ArrowRight } from 'lucide-react';
import { studentApi } from '../api/studentApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';
  const courseFilter = searchParams.get('course') || '';

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchFilter) params.search = searchFilter;
      if (courseFilter) params.course = courseFilter;

      const res = await studentApi.getAll(params);
      setStudents(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchFilter, courseFilter]);

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
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.2rem' }}>
            Enrolled Student Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track individual student fee accounts, payment histories, and generate receipts
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by student name, roll number, or email..."
              value={searchFilter}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              value={courseFilter}
              onChange={(e) => handleFilterChange('course', e.target.value)}
            >
              <option value="">All Programs</option>
              <option value="B.Tech CSE">B.Tech CSE</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
            </select>
          </div>

          {(searchFilter || courseFilter) && (
            <button
              onClick={() => setSearchParams({})}
              className="btn btn-outline btn-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading student roster..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          description="No students matched your search criteria."
        />
      ) : (
        <div className="card" style={{ padding: '0.5rem' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Course / Program</th>
                  <th>Semester</th>
                  <th>Email & Phone</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {st.rollNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{st.name}</strong>
                    </td>
                    <td>{st.course}</td>
                    <td>Sem {st.semester}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>{st.email}</div>
                        <div style={{ color: 'var(--text-dim)' }}>{st.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          to={`/admin/students/${st._id}/fees`}
                          className="btn btn-outline btn-sm"
                        >
                          <FileText size={14} />
                          Ledger
                        </Link>
                        <Link
                          to={`/admin/payments/new?studentId=${st._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          <CreditCard size={14} />
                          Collect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
