<template>
	<div class="com-container">
		<div class="com-chart" ref="rankRef"></div>
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
				// 区域缩放的起点和重点
				startValue: 0,
				endValue: 9,
				// 定时器标识
				timeId: null
			}
		},
		created() {
			this.$socket.registerCallBack('rankData', this.getData);
		},
		mounted() {
			this.initChart();

			// this.getData();
			this.$socket.send({
				action: 'getData',
				socketType: 'rankData',
				chartName: 'rank',
				value: ''
			});

			window.addEventListener('resize', this.screenAdapter);
			this.screenAdapter();
		},
		destroyed() {
			window.removeEventListener('resize', this.screenAdapter);
			clearInterval(this.timeId);
			this.$socket.unRegisterCallBack('rankData');
		},
		methods: {
			async initChart() {
				this.chartInstance = this.$echarts.init(this.$refs.rankRef, this.theme);
				const initOption = {
					title: {
						text: '▎地区销售排行',
						left: 20,
						top: 20
					},
					grid: {
						top: '40%',
						left: '5%',
						right: '5%',
						bottom: '5%',
						// 坐标轴的大小是否包含坐标轴上的文字
						containLabel: true
					},
					tooltip: {
						show: true
					},
					xAxis: {
						type: 'category'
					},
					yAxis: {
						type: 'value'
					},
					series: [
						{
							type: 'bar'
						}
					]
				};
				this.chartInstance.setOption(initOption);

				this.chartInstance.on(('mouseover'), () => {
					clearInterval(this.timeId);
				});
				this.chartInstance.on(('mouseout'), () => {
					this.startInterval();
				});
			},

			/* async getData() {
				const { data: ret } = await this.$http.get('rank');
				this.allData = ret;
				// 从大到小进行排序
				this.allData.sort((itemA, itemB) => {
					return itemB.value - itemA.value;
				});
				this.updateChart();
				this.startInterval();
			}, */
			getData(ret) {
				// ret 就是服务端发送给客户端的图表的数据
				this.allData = ret;
				this.allData.sort((itemA, itemB) => {
					return itemB.value - itemA.value;
				});
				this.updateChart();
				this.startInterval();
			},

			updateChart() {
				const colorArr = [
					['#0ba82c', '#4ff778'],
					['#2e72bf', '#23e5e5'],
					['#5052ee', '#ab6ee5']
				];
				// 所有省份形成的数组
				const provinceArr = this.allData.map(item => {
					return item.name;
				});
				// 所有省份对应的销售金额
				const valueArr = this.allData.map(item => {
					return item.value;
				});
				const dataOption = {
					xAxis: {
						data: provinceArr
					},
					dataZoom: {
						show: false,
						startValue: this.startValue,
						endValue: this.endValue
					},
					series: [
						{
							data: valueArr,
							itemStyle: {
								color: arg => {
									let targetColorArr = null;
									if (arg.value > 300) {
										targetColorArr = colorArr[0];
									} else if (arg.value > 200) {
										targetColorArr = colorArr[1];
									} else {
										targetColorArr = colorArr[2];
									}
									return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
										{
											offset: 0,
											color: targetColorArr[0]
										},
										{
											offset: 1,
											color: targetColorArr[1]
										}
									]);
								}
							}
						}
					]
				};
				this.chartInstance.setOption(dataOption);
			},
			screenAdapter() {
				const titleFontSize = this.$refs.rankRef.offsetWidth / 100 * 3.6;
				const adapterOption = {
					title: {
						textStyle: {
							fontSize: titleFontSize
						}
					},
					series: [
						{
							// 柱的宽度
							barWidth: titleFontSize,
							// 实现柱顶部半圆形效果
							itemStyle: {
								borderRadius: [
									// 左上角
									titleFontSize / 2,
									// 右上角
									titleFontSize / 2,
									0,
									0
								]
							}
						}
					]
				};
				this.chartInstance.setOption(adapterOption);
				this.chartInstance.resize();
			},
			startInterval() {
				this.timeId && clearInterval(this.timeId);
				this.timeId = setInterval(() => {
					this.startValue++,
						this.endValue++;
					if (this.endValue > this.allData.length - 1) {
						this.startValue = 0;
						this.endValue = 9;
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
