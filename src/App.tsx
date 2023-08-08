import { Layout, theme } from 'antd';
import FooterLayout from './layout/FooterLayout';
import SiderLayout from './layout/SiderLayout';
import HeaderLayout from './layout/HeaderLayout';
import BreadcrumbLayout from './layout/BreadcrumbLayout';
import Counter from './pages/CountPage/Counter';
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
          <ContentWrap $colorBg={colorBgContainer}>
            Bill is a cat.
            <Counter />
          </ContentWrap>
        </Content>
        <FooterLayout />
      </Layout>
    </Layout>
  );
};

export default App;

/**
 * 写在render外部 避免每次渲染都重新创建
 * 变量命名需要带美元符号前缀
 */
const ContentWrap = styled.div<{$colorBg: string}>`
  padding: 24px;
  min-height: 360px;
  background-color: ${props => props.$colorBg}
`;
