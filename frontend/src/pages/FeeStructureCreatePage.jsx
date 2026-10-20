import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeeStructureForm from '../components/FeeStructureForm.jsx';
import { feeStructureApi } from '../api/feeStructureApi.js';

const FeeStructureCreatePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await feeStructureApi.create(formData);
      navigate('/admin/fees');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <FeeStructureForm
        title="Create New Course Fee Structure"
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default FeeStructureCreatePage;
