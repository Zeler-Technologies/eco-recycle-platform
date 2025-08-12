
import React from 'react';
import TenantCustomersList from '@/components/Tenant/TenantCustomersList';

const TenantCustomersPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <TenantCustomersList />
    </div>
  );
};

export default TenantCustomersPage;
