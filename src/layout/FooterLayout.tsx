import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const FooterLayout: React.FC = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>React Seed &copy;{new Date().getFullYear()} Created by liujun</Footer>
  );
};

export default FooterLayout;