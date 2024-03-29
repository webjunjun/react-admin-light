import { createGlobalStyle } from 'styled-components';

// 创建全局的样式
export const GlobalStyle = createGlobalStyle`
// 我的重置
html {
  font-family: -apple-system, BlinkMacSystemFont, "Microsoft YaHei", sans-serif, "Helvetica Neue";
  font-size: 16px;
  line-height: 1.75;
  color: #333;
  background-color: #f9f9f9;

  // 禁止选中文字
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  scroll-behavior: smooth;
}

body,
p,
h1,
h2,
h3,
ul,
ol,
dl,
dd,
figure,
menu {
  margin: 0;
}

ul,
ol,
input,
textarea,
figure,
menu {
  padding: 0;
}

main,
details {
  display: block;
}

// 统一标题的表现形式
h1,
h2,
h3 {
  font-size: 100%;
  font-weight: 400;
}

// 合并表格边框和相邻单元格的边框间的距离为0
table {
  border-collapse: collapse;
  border-spacing: 0;
}

// 清除无序列表圆点样式
ul {
  list-style: none;
}

// 用于浮动元素的父元素
.clearfix::after {
  display: block;
  height: 0;
  clear: both;
  content: ".";
  visibility: hidden;
}

.clearfix {
  // 兼容IE6、7
  *zoom: 1;
}

// 占位符placeholder的颜色改变
input:-moz-placeholder,
textarea:-moz-placeholder {
  color: #999;
}

input::-moz-placeholder,
textarea::-moz-placeholder {
  color: #999;
}

input::-webkit-input-placeholder,
textarea::-webkit-input-placeholder {
  color: #999;
}

input:-ms-input-placeholder,
textarea:-ms-input-placeholder {
  color: #999;
}

// 清除chrome自动填充密码的样式
input:-internal-autofill-previewed,
input:-internal-autofill-selected {
  box-shadow: inset 0 0 0 1000px #2e3b4e;
  -webkit-text-fill-color: #fff;
}

.text-wrap {
  // 以字母为依据换行，数字也可以
  word-break: break-all;
  word-wrap: break-word;

  // 针对中文换行
  white-space: pre-wrap;
}

// 文本溢出，省略号显示 宽度自控制
.text-tradition {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 选择文字后的背景色
body ::selection {
  color: #333;
  text-shadow: none;
  background-color: #fef032;
}

// 去掉IE浏览器文本框的小X和密码框的眼睛,(只能IE10以上)
::-ms-clear,
::-ms-reveal {
  display: none;
}

// 整个滚动条
body::-webkit-scrollbar {
  width: 5px;
}
// 滚动条轨道
body::-webkit-scrollbar-track {
  background-color: transparent;
  border-radius: 6px;
}

// 滚动条上的滚动滑块
body::-webkit-scrollbar-thumb {
  background: #7b6f6f;
  border-radius: 6px;
}
`
