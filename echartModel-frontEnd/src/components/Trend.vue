<template>
	<div class="com-container">
		<div class="title" :style="comStyle">
			<span style="cursor: default">{{ '▎' + showTitle }}</span>
			<span
				@click="showChoice = !showChoice"
				class="iconfont title-icon icon-arrow-down"
				:style="comStyle"
			></span>
			<div class="select-icon" v-show="showChoice" :style="marginStyle">
				<div
					@click="handleSelect(item.key)"
					class="select-item"
					v-for="item in selectType"
					:key="item.key"
				>
					{{ item.text }}
				</div>
			</div>
		</div>
		<div class="com-chart" ref="trendRef"></div>
	</div>
</template>

<script>
	import { mapState } from 'vuex';
	import { getThemeValue } from '@/utils/theme_utils'
	export default {
		name: 'Trend',
		data() {
			return {
				chartInstance: null,
				// 从服务器中获取的所有数据
				allData: null,
				// 是否显示可选项
				showChoice: false,
				// 显示的数据的类型
				choiceType: 'map',
				// 指明标题的字体大小
				titleFontSize: 0
			}
		},
		created() {
			// 组件创建完成后 进行回调函数的注册
			this.$socket.registerCallBack('trendData', this.getData);
		},
		mounted() {
			this.initChart();

			// this.getData();
			// 给服务器发送数据
			this.$socket.send({
				action: 'getData',
				socketType: 'trendData',
				chartName: 'trend',
				value: ''
			});

			window.addEventListener('resize', this.screenAdapter);
			this.screenAdapter();
		},
		destroyed() {
			window.removeEventListener('resize', this.screenAdapter);
			// 组件销毁的时候 进行回调函数的取消
			this.$socket.unRegisterCallBack('trendData');
		},
		computed: {
			...mapState(['theme']),
			selectType() {
				if (!this.allData) {
					return [];
				} else {
					return this.allData.type.filter(item => {
						return item.key !== this.choiceType;
					});
				}
			},
			showTitle() {
				if (!this.allData) {
					return '';
				} else {
					return this.allData[this.choiceType].title;
				}
			},
			// 设置给标题的样式
			comStyle() {
				return {
					fontSize: this.titleFontSize + 'px',
					color: getThemeValue(this.theme).titleColor
				};
			},
			marginStyle() {
				return {
					marginLeft: this.titleFontSize + 'px'
				};
			}
		},
		methods: {
			initChart() {
				this.chartInstance = this.$echarts.init(this.$refs.trendRef, this.theme);
				const initOption = {
					grid: {
						left: '3%',
						top: '35%',
						right: '4%',
						bottom: '1%',
						// 把坐标轴的文字 控制在范围大小以内
						containLabel: true
					},
					legend: {
						left: 20,
						top: '15%',
						icon: 'circle'
					},
					xAxis: {
						type: 'category',
						// x轴 挤紧挨边缘
						boundaryGap: false
					},
					yAxis: {
						type: 'value'
					}
				};
				this.chartInstance.setOption(initOption);
			},

			/* async getData() {
				const { data: ret } = await this.$http.get('trend');
				this.allData = ret;
				this.updateChart();
			}, */
			getData(ret) {
				// ret 就是服务端发送给客户端的图表的数据
				this.allData = ret;
				this.updateChart();
			},

			updateChart() {
				// 半透明的颜色值
				const colorArr1 = [
					'rgba(11, 168, 44, 0.5)',
					'rgba(44, 110, 255, 0.5)',
					'rgba(22, 242, 217, 0.5)',
					'rgba(254, 33, 30, 0.5)',
					'rgba(250, 105, 0, 0.5)'
				];
				// 全透明的颜色值
				const colorArr2 = [
					'rgba(11, 168, 44, 0)',
					'rgba(44, 110, 255, 0)',
					'rgba(22, 242, 217, 0)',
					'rgba(254, 33, 30, 0)',
					'rgba(250, 105, 0, 0)'
				];

				// 处理数据
				// 类目轴的数据
				const timeArr = this.allData.common.month;

				// y轴的数据 series下的数据
				const valueArr = this.allData[this.choiceType].data;
				const seriesArr = valueArr.map((item, index) => {
					return {
						name: item.name,
						type: 'line',
						data: item.data,
						// 数据堆叠
						stack: this.choiceType,
						areaStyle: {
							color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
								// 0%的颜色值
								{
									offset: 0,
									color: colorArr1[index]
								},
								// 100%的颜色值
								{
									offset: 1,
									color: colorArr2[index]
								}
							])
						}
					}
				});

				// 图例的数据
				const legendArr = valueArr.map(item => {
					return item.name
				});

				const dataOption = {
					xAxis: {
						data: timeArr
					},
					legend: {
						data: legendArr
					},
					series: seriesArr
				};
				this.chartInstance.setOption(dataOption);
			},
			screenAdapter() {
				this.titleFontSize = this.$refs.trendRef.offsetWidth / 100 * 3.6;

				const adapterOption = {
					legend: {
						itemWidth: this.titleFontSize,
						itemHeight: this.titleFontSize,
						itemGap: this.titleFontSize,
						textStyle: {
							fontSize: this.titleFontSize / 2
						}
					}
				};
				this.chartInstance.setOption(adapterOption);

				this.chartInstance.resize();
			},
			handleSelect(currentValue) {
				this.choiceType = currentValue;
				this.updateChart();
				this.showChoice = false;
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
.title {
	position: absolute;
	left: 20px;
	top: 20px;
	z-index: 10;
	color: white;

	.title-icon {
		margin-left: 10px;
		cursor: pointer;
	}

	.select-item {
		cursor: pointer;
	}

	.select-icon {
		background-color: red;
	}
}
</style>
