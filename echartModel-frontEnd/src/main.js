import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

// 引入字体文件
import './assets/font/iconfont.css'

// 引入全局样式
import './assets/css/global.less';

// 加载echarts主题
import '../public/static/theme/chalk';
import '../public/static/theme/vintage';

import * as echarts from 'echarts';

import axios from 'axios';

import SocketService from '@/utils/socket_service';

Vue.prototype.$socket = SocketService.Instance;
// 对服务端进行websocket连接
SocketService.Instance.connect();

axios.defaults.baseURL = 'http://175.27.228.178:3000/api/';

// 将全局的echarts对象挂载到Vue的原型对象上
Vue.prototype.$echarts = echarts;

Vue.prototype.$http = axios;

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
