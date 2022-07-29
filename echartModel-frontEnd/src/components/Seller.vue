<template>
  <div class="com-container">
    <div class="com-chart" ref="sellerRef"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: 'Seller',
  data() {
    return {
      chartInstance: null,
      // 服务器返还的数据
      allData: null,

      // 当前显示的页数
      currentPage: 1,
      // 一共多少页
      totalPage: 0,

      // 定时器表示
      timerId: null,
    };
  },
  created() {
    this.$socket.registerCallBack('sellerData', this.getData);
  },
  mounted() {
    this.initChart();

    // this.getData();
    this.$socket.send({
      action: 'getData',
      socketType: 'sellerData',
      chartName: 'seller',
      value: '',
    });

    window.addEventListener('resize', this.screenAdapter);

    // 界面加载完成的时候，主动进行屏幕的适配
    this.screenAdapter();
  },
  destroyed() {
    clearInterval(timerId);
    window.removeEventListener('resize', this.screenAdapter);
    this.$socket.unRegisterCallBack('sellerData');
  },
  methods: {
    initChart() {
      // 初始化echartInstance对象
      this.chartInstance = this.$echarts.init(this.$refs.sellerRef, this.theme);

      // 对图标初始化配置的控制
      const initOption = {
        title: {
          text: '▎商家销售统计',
          textStyle: {
            fontSize: 66,
          },
          left: 20,
          top: 20,
        },
        grid: {
          top: '20%',
          left: '3%',
          right: '6%',
          bottom: '3%',
          // 包含坐标轴中的文字
          containLabel: true,
        },
        xAxis: {
          type: 'value',
        },
        yAxis: {
          type: 'category',
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            z: 0,
            lineStyle: {
              width: 66,
              color: '#2d3443',
              type: 'solid',
            },
          },
        },
        series: [
          {
            type: 'bar',
            barWidth: 66,
            label: {
              show: true,
              position: 'right',
              textStyle: {
                color: 'white',
              },
            },
            itemStyle: {
              barBorderRadius: [0, 33, 33, 0],
              // 颜色的线性渐变
              // 指明颜色渐变的方向  指明不同百分比之下颜色的值
              color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  // 0% 状态下的颜色值
                  offset: 0,
                  color: '#505211',
                },
                {
                  // 100% 状态下的颜色值
                  offset: 1,
                  color: '#ab6ee5',
                },
              ]),
            },
          },
        ],
      };
      this.chartInstance.setOption(initOption);

      // 对图标对象进行鼠标事件的监听
      this.chartInstance.on('mouseover', () => {
        clearInterval(this.timerId);
      });
      this.chartInstance.on('mouseout', () => {
        this.startInterval();
      });
    },

    // 获取服务器的数据
    /* async getData() {
				const { data: ret } = await this.$http.get('seller');
				console.log(ret);
				this.allData = ret;
				this.allData.sort((element1, element2) => {
					return element1.value - element2.value
				});
				// 每5个元素 显示一页
				this.totalPage = this.allData.length % 5 === 0 ? this.allData.length / 5 : this.allData.length / 5 + 1;
				this.updateChart();

				// 启动定时器
				this.startInterval();
			}, */
    getData(ret) {
      // ret 就是服务端发送给客户端的图表的数据
      this.allData = ret;
      this.allData.sort((element1, element2) => {
        return element1.value - element2.value;
      });
      // 每5个元素 显示一页
      this.totalPage =
        this.allData.length % 5 === 0
          ? this.allData.length / 5
          : this.allData.length / 5 + 1;
      this.updateChart();

      // 启动定时器
      this.startInterval();
    },

    // 更新图表
    updateChart() {
      const start = (this.currentPage - 1) * 5;
      const end = this.currentPage * 5;

      const showData = this.allData.slice(start, end);

      const sellerNames = showData.map((item) => {
        return item.name;
      });
      const sellerValues = showData.map((item) => {
        return item.value;
      });
      const dataOption = {
        yAxis: {
          data: sellerNames,
        },
        series: {
          data: sellerValues,
        },
      };
      this.chartInstance.setOption(dataOption);
    },

    startInterval() {
      this.timerId && clearInterval(this.timerId);

      this.timerId = setInterval(() => {
        this.currentPage++;
        if (this.currentPage > this.totalPage) {
          this.currentPage = 1;
        }
        this.updateChart();
      }, 2000);
    },

    // 浏览器的大小发生变化的时候，会调用的方法，来完成屏幕的适配
    screenAdapter() {
      const titleFontSize = (this.$refs.sellerRef.offsetWidth / 100) * 3.6;

      // 和分辨率大小相关的配置项
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        tooltip: {
          lineStyle: {
            width: titleFontSize,
          },
        },
        series: {
          barWidth: titleFontSize,
          itemStyle: {
            barBorderRadius: [0, titleFontSize / 2, titleFontSize / 2, 0],
          },
        },
      };
      this.chartInstance.setOption(adapterOption);

      this.chartInstance.resize();
    },
  },
  computed: {
    ...mapState(['theme']),
  },
  watch: {
    theme() {
      // 当前图表销毁
      this.chartInstance.dispose();
      // 以最新的主题初始化图表对象
      this.initChart();
      // 屏幕适配
      this.screenAdapter();
      // 更新图表的展示
      this.updateChart();
    },
  },
};
</script>

<style lang="less" scoped></style>
