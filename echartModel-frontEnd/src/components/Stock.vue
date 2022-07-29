<template>
	<div class="com-container">
		<div class="com-chart" ref="stockRef"></div>
	</div>
</template>

<script>
	import { mapState } from 'vuex';
	export default {
		name: '',
		data() {
			return {
				chartInstance: null,
				allData: null,
				currentIndex: 0,
				timerId: null
			}
		},
		created() {
			this.$socket.registerCallBack('stockData', this.getData);
		},
		mounted() {
			this.initChart();

			// this.getData();
			this.$socket.send({
				action: 'getData',
				socketType: 'stockData',
				chartName: 'stock',
				value: ''
			});

			window.addEventListener('resize', this.screenAdapter);
			this.screenAdapter();
		},
		destroyed() {
			window.removeEventListener('resize', this.screenAdapter);
			clearInterval(this.timerId);
			this.$socket.unRegisterCallBack('stockData');
		},
		methods: {
			async initChart() {
				this.chartInstance = this.$echarts.init(this.$refs.stockRef, this.theme);

				const initOption = {
					title: {
						text: '▎库存和销量分析',
						left: 20,
						top: 20
					}
				};
				this.chartInstance.setOption(initOption);
				this.chartInstance.on('mouseover', () => {
					clearInterval(this.timerId);
				});
				this.chartInstance.on('mouseout', () => {
					this.startInterval();
				});
			},

			/* async getData() {
				const { data: ret } = await this.$http.get('stock');
				this.allData = ret;
				this.updateChart();
				this.startInterval();
			}, */
			getData(ret) {
				// ret 就是服务端发送给客户端的图表的数据
				this.allData = ret;
				this.updateChart();
				this.startInterval();
			},

			updateChart() {
				const centerArr = [
					['18%', '40%'],
					['50%', '40%'],
					['82%', '40%'],
					['34%', '75%'],
					['66%', '75%']
				];
				const colorArr = [
					['#4FF778', '#0BA82C'],
					['#E5DD45', '#E8B11C'],
					['#E8821C', '#E55445'],
					['#5052EE', '#AB6EE5'],
					['#23E5E5', '#2E72BF']
				];

				const start = this.currentIndex * 5;
				const end = (this.currentIndex + 1) * 5;
				const showData = this.allData.slice(start, end);
				const seriesArr = showData.map((item, index) => {
					return {
						type: 'pie',
						// 外圆半径 内圆半径
						// radius: [110, 100],
						center: centerArr[index],
						avoidLabelOverlap: false,
						// 关闭输入移入饼图时的动画效果
						hoverAnimation: false,
						// 图形是否不响应和触发鼠标事件，默认为 false，即响应和触发鼠标事件
						silent: true,
						// 指示线 隐藏
						labelLine: {
							normal: {
								show: false
							},
							emphasis: {
								show: false
							}
						},
						data: [
							// 销量
							{
								name: item.name + '\n\n' + item.sales,
								value: item.sales,
								itemStyle: {
									color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0,
										[
											{
												offset: 0,
												color: colorArr[index][0]
											},
											{
												offset: 1,
												color: colorArr[index][1]
											}
										])
								},
								label: {
									color: colorArr[index][0],
									position: 'center'
								}
							},
							// 库存
							{
								value: item.stock,
								itemStyle: {
									color: '#333843'
								}
							}
						]
					};
				});
				const dataOption = {
					series: seriesArr
				};
				this.chartInstance.setOption(dataOption);
			},
			screenAdapter() {
				const titleFontSize = this.$refs.stockRef.offsetWidth / 100 * 3.6;
				const innerRadius = titleFontSize * 2.8;
				const outterRadius = innerRadius * 1.125;

				let config = {
					type: 'pie',
					radius: [outterRadius, innerRadius],
					label: {
						fontSize: titleFontSize / 2
					}
				}

				let ret = [];
				for (let index = 0; index < 5; index++) {
					ret.push(config);
				}

				const adapterOption = {
					title: {
						textStyle: {
							fontSize: titleFontSize
						}
					},
					series: ret
				};
				this.chartInstance.setOption(adapterOption);
				this.chartInstance.resize();
			},
			startInterval() {
				this.timerId && clearInterval(this.timerId);
				this.timerId = setInterval(() => {
					this.currentIndex++;
					if (this.currentIndex > 1) {
						this.currentIndex = 0;
					}
					this.updateChart();
				}, 2000);
			}
		},
		computed: {
			...mapState(['theme'])
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
			}
		}
	};
</script>

<style lang="less" scoped>
</style>