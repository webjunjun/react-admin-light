import '@/assets/css/layouts.less'

import { Layout } from 'antd'
import LayoutSider from './LayoutSider'
import LayoutHeader from './LayoutHeader'
import LayoutContent from './LayoutContent'
import LayoutFooter from './LayoutFooter'

const LayoutIndex = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <LayoutSider />
      <Layout className="site-layout">
        <LayoutHeader />
        <LayoutContent />
        <LayoutFooter />
      </Layout>
    </Layout>
  )
}

export default LayoutIndex
