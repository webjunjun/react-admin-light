const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer') // 分析模板依赖大小用的，在开发时打开服务器
const CompressionWebpackPlugin = require('compression-webpack-plugin') // 打包时压缩代码成gzip，如果服务器开启了gzip可以大大压缩大小
const CracoLessPlugin = require('craco-less') // 配合按需加载antd 和 修改主题使用
const WebpackBar = require('webpackbar') // 显示打包进度条

const port = process.env.PORT || 9527
const fixRequestBody = function (proxyReq, req, res) {
  // 重写代理的请求头信息
  console.log(proxyReq, req, res)
}

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    plugins: [
      new CompressionWebpackPlugin({
        filename: '[path].gz',
        algorithm: 'gzip',
        test: new RegExp('\\.(' + ['js', 'css', 'scss', 'less'].join('|') + ')$'),
        threshold: 1024, // 大于1024KB会被压缩
        minRatio: 0.8 // 压缩率小于0.8的会被处理
      }),
      new WebpackBar({
        name: process.env.NODE_ENV === 'production' ? '正在打包' : '正在启动',
        color: '#fa8c16'
      })
    ],
    // 配置cdn外部资源不打包
    // externals: {
    //   echarts: 'echarts',
    // },
    configure: (webpackConfig, { env, paths }) => {
      // 任何webpack的配置都可以在这里补充
      if(env !== 'production'){
        // 非生产环境打开依赖分析
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            openAnalyzer: process.env.NODE_ENV === 'production' ? false : true, // 是否打开浏览器
            analyzerMode: process.env.NODE_ENV === 'production' ? disabled : 'server', // 分析使用哪种模式
            generateStatsFile: false, // 不构建分析文件
            defaultSizes: 'gzip',
            analyzerHost: '127.0.0.1', // 分析服务ip
            analyzerPort: 'auto', // 自动分配端口
            reportFilename: path.resolve(__dirname, `analyzer/index.html`)
          })
        )
      }
      return webpackConfig
    }
  },
  babel: {
    plugins: [
      // antd按需加载
      // style 为 true ,需要配置 craco-less一起才能生效
      [
        'import',
        {
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: true
        },
        'antd'
      ]
      // style 为css ,不需要 craco-less
      // ['import', { libraryName: 'antd', libraryDirectory: 'es', style: "css" }],
    ]
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#1890ff' },
            javascriptEnabled: true,
            //配置全局less 变量，不需要在使用的地方导入了
            globalVars: {
              hack: `true; @import '~@/assets/style/variable.less';`
            }
          }
        }
      }
    }
  ],
  devServer: {
    // open: true, // 打包时自动打开浏览器
    port, // 设置端口
    // host: 'localhost', // 设置本地host 可以设置成 local-ip | local-ipv4 | local-ipv6 | 任意的字符串
    https: false, // 是否启用https
    proxy: {
      '/api': {
        target: 'http://172.23.150.16:8761', // 目标代理接口地址
        secure: false,
        changeOrigin: true, // 开启代理，在本地创建一个虚拟服务端
        ws: false, // 是否启用websocket
        pathRewrite: {
          '^/api': ''
        },
        // 重写代理的请求头信息
        onProxyReq: fixRequestBody
      }
    },
    // 出现编译错误时 在浏览器里全屏覆盖
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
}
