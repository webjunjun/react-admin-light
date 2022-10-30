// 用于生成路由以及左侧菜单
import LayoutAdmin from '@/layouts'
import Home from '@/pages/home/home.js'
import List from '@/pages/list/list.js'

const routes = [{
  name: 'LayoutAdmin',
  component: LayoutAdmin,
  hideMenu: true,
  children: [{
    name: 'Home',
    component: Home,
    url: '/home',
    meta: {
      title: '首页'
    }
  }, {
    name: 'List',
    component: List,
    url: '/list',
    meta: {
      title: '列表'
    }
  }]
}]

export default routes
