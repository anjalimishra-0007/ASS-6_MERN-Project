import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No Records Found',
  description = 'There are no items matching your criteria at this moment.',
  action
}) => {
  return (
    <div className="state-container">
      <Icon className="state-icon" />
      <h3 className="state-title">{title}</h3>
      <p className="state-desc">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
