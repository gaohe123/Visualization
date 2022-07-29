<template>
	<div class="com-container">
		<div class="com-chart" ref="hotRef"></div>
		<span class="iconfont arr-left" @click="toLeft" :style="comStyle"
			>&#xe6ef;</span
		>
		<span class="iconfont arr-right" @click="toRight" :style="comStyle"
			>&#xe6ed;</span
		>
		<span class="cat-name" :style="comStyle">
			{{ catName }}
		</span>
	</div>
</template>

<script>
	import { mapState } from 'vuex';
	import { getThemeValue } from '@/utils/theme_utils'
	export default {
		name: '',
		data() {
			return {
				chartInstance: null,
				allData: null,
				// 当前所展示的一级分类数据
				currentIndex: 0,
				titleFontSize: 0
			}
		},
		computed: {
			...mapState(['theme']),
			catName() {
				if (!this.allData) {
					return '';
				} else {
					return this.allData[this.currentIndex].name;
				}
			},
			comStyle() {
				return {
					fontSize: this.titleFontSize + 'px',
					color: getThemeValue(this.theme).titleColor
				}
			}
		},
		created() {
			this.$socket.registerCallBack('hotData', this.getData);
		},
		mounted() {
			this.initChart();

			// this.getData();
			this.$socket.send({
				action: 'getData',
				socketType: 'hotData',
				chartName: 'hot',
				value: ''
			});

			window.addEventListener('resize', this.screenAdapter);
			this.screenAdapter();
		},
		destroyed() {
			window.removeEventListener('resize', this.screenAdapter);
			this.$socket.unRegisterCallBack('hotData');
		},
		methods: {
			async initChart() {
				this.chartInstance = this.$echarts.init(this.$refs.hotRef, this.theme);

				const initOption = {
					title: {
						text: '▎热销商品占比',
						left: 20,
						top: 20
					},
					legend: {
						top: '15%',
						icon: 'circle'
					},
					tooltip: {
						show: true,
						// 决定tooltip中的显示文字内容
						formatter: arg => {
							const thirdCategory = arg.data.children;
							let total = 0;
							thirdCategory.forEach(element => {
								total += element.value;
							});
							let retStr = '';
							thirdCategory.forEach(item => {
								retStr += `${item.name}: ${parseInt(item.value / total * 100) + '%'} <br/>`;
							});
							return retStr;
						}
					},
					series: [
						{
							type: 'pie',
							label: {
								show: false
							},
							// 饼图处于高亮状态情况下，应用的一些样式
							emphasis: {
								label: {
									show: true
								},
								labelLine: {
									show: false
								}
							}
						}
					]
				};
				this.chartInstance.setOption(initOption);
			},

			/* async getData() {
				const { data: ret } = await this.$http.get('hot');
				this.allData = ret;
				// console.log(this.allData);
				this.updateChart();
			}, */
			getData(ret) {
				// ret 就是服务端发送给客户端的图表的数据
				this.allData = ret;
				this.updateChart();
			},

			updateChart() {
				const legendData = this.allData[this.currentIndex].children.map(item => {
					return item.name;
				});
				const seriesData = this.allData[this.currentIndex].children.map(item => {
					return {
						name: item.name,
						value: item.value,
						children: item.children
					};
				});
				const dataOption = {
					legend: {
						data: legendData
					},
					series: [
						{
							data: seriesData
						}
					]
				};
				this.chartInstance.setOption(dataOption);
			},
			screenAdapter() {
				this.titleFontSize = this.$refs.hotRef.offsetWidth / 100 * 3.6;
				const adapterOption = {
					title: {
						textStyle: {
							fontSize: this.titleFontSize
						}
					},
					legend: {
						// 图例的大小
						itemWidth: this.titleFontSize / 2,
						itemHeight: this.titleFontSize / 2,
						// 图例也图例之间的间隔
						itemGap: this.titleFontSize / 2,
						// 图例文字的大小
						textStyle: {
							fontSize: this.titleFontSize / 2
						}
					},
					series: [
						{
							// 饼图的大小是通过半径决定
							radius: this.titleFontSize * 4.5,
							// 饼图的位置
							center: ['50%', '50%']
						}
					]
				};
				this.chartInstance.setOption(adapterOption);
				this.chartInstance.resize();
			},
			toLeft() {
				this.currentIndex--;
				if (this.currentIndex < 0) {
					this.currentIndex = this.allData.length - 1;
				}
				this.updateChart();
			},
			toRight() {
				this.currentIndex++;
				if (this.currentIndex > this.allData.length - 1) {
					this.currentIndex = 0;
				}
				this.updateChart();
			}
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
.arr-left {
	position: absolute;
	left: 10%;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	color: white;
}

.arr-right {
	position: absolute;
	right: 10%;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	color: white;
}

.cat-name {
	position: absolute;
	left: 80%;
	bottom: 20px;
	color: white;
}
</style>