import React from 'react';
import { Breadcrumb } from 'antd';

const BreadcrumbLayout: React.FC = () => {
  return (
    <Breadcrumb
      items={[{title: 'User'}, {title: 'Bill'}]}
      style={{ margin: '16px 0' }}
    />
  );
};

export default BreadcrumbLayout;