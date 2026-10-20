import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FeeStructureForm from '../components/FeeStructureForm.jsx';
import { feeStructureApi } from '../api/feeStructureApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const FeeStructureEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feeStructure, setFeeStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await feeStructureApi.getById(id);
        setFeeStructure(res.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch fee structure');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const handleUpdate = async (formData) => {
    setIsSubmitting(true);
    try {
      await feeStructureApi.update(id, formData);
      navigate('/admin/fees');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading fee structure details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => navigate('/admin/fees')} />;
  }

  return (
    <div>
      <FeeStructureForm
        title={`Edit Fee Structure: ${feeStructure?.course || ''} (Sem ${feeStructure?.semester || ''})`}
        initialData={feeStructure}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default FeeStructureEditPage;
