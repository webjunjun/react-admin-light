import React from 'react';
import { Layout, theme } from 'antd';
import FooterLayout from './layout/FooterLayout';
import SiderLayout from './layout/SiderLayout';
import HeaderLayout from './layout/HeaderLayout';
import BreadcrumbLayout from './layout/BreadcrumbLayout';
import styled from 'styled-components';

const { Content } = Layout;

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SiderLayout />
      <Layout className="site-layout">
        <HeaderLayout />
        <Content style={{ margin: '0 16px' }}>
          <BreadcrumbLayout />
          <ContentWrap colorBg={colorBgContainer}>
            Bill is a cat.
          </ContentWrap>
        </Content>
        <FooterLayout />
      </Layout>
    </Layout>
  );
};

export default App;

const ContentWrap = styled.div`
  padding: 24px;
  min-height: 360px;
  background-color: ${(p: {colorBg: string}) => p.colorBg}
`;
