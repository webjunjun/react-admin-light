import axios, { AxiosInstance } from 'axios'
import { setting } from './setting'

// 新建一个axios实例，配置请求默认设置
const service: AxiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? setting.devBaseUrl : setting.baseUrl,
  // withCredentials: true, // 跨域请求是否携带cookie
  timeout: 60000 // 请求超时设置
})