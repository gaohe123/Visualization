<template>
	<div class="com-container" @dblclick="revertMap">
		<div class="com-chart" ref="mapRef"></div>
	</div>
</template>

<script>
	import axios from 'axios';
	import { mapState } from 'vuex';
	import { getProvinceMapInfo } from '@/utils/map_utils';
	export default {
		name: '',
		data() {
			return {
				chartInstance: null,
				allData: null,
				// 获取的省份的地图矢量数据
				mapData: {}
			}
		},
		created() {
			this.$socket.registerCallBack('mapData', this.getData);
		},
		mounted() {
			this.initChart();

			// this.getData();
			this.$socket.send({
				action: 'getData',
				socketType: 'mapData',
				chartName: 'map',
				value: ''
			});

			window.addEventListener('resize', this.screenAdapter);
			this.screenAdapter();
		},
		destroyed() {
			window.removeEventListener('resize', this.screenAdapter);
			this.$socket.unRegisterCallBack('mapData');
		},
		methods: {
			async initChart() {
				this.chartInstance = this.$echarts.init(this.$refs.mapRef, this.theme);
				// 获取中国地图的矢量数据
				const ret = await axios.get('http://localhost:4000/static/map/china.json');
				// console.log(ret);
				this.$echarts.registerMap('china', ret.data);
				const initOption = {
					title: {
						text: '▎商家分布',
						left: 20,
						top: 20
					},
					geo: {
						type: 'map',
						map: 'china',
						top: '5%',
						bottom: '5%',
						itemStyle: {
							areaColor: '#2e72bf',
							borderColor: '#333'
						}
					},
					legend: {
						left: '5%',
						bottom: '5%',
						// 图例方向
						orient: 'vertical'
					}
				};
				this.chartInstance.setOption(initOption);

				// 地图点击事件的监听
				this.chartInstance.on('click', async arg => {
					// arg.name 获取点击的省份
					const provinceInfo = getProvinceMapInfo(arg.name);
					// 获取相关省份的地图矢量数据
					// 判断当前所点击的这个省份地图矢量数据在mapData中是否存在
					if (!this.mapData[provinceInfo.key]) {
						const ret = await axios.get('http://localhost:4000' + provinceInfo.path);
						this.mapData[provinceInfo.key] = ret.data;
						// console.log(ret);
						this.$echarts.registerMap(provinceInfo.key, ret.data);
					}
					const changeOption = {
						geo: {
							map: provinceInfo.key
						}
					};
					this.chartInstance.setOption(changeOption);
				});
			},

			/* async getData() {
				const { data: ret } = await this.$http.get('map');
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
				// 处理图表需要的数据
				const legendArr = this.allData.map(item => {
					return item.name;
				});
				const seriesArr = this.allData.map(item => {
					// return的这个对象就代表的是一个类别下的所有散点数据
					// 如果需要在地图中显示散点的数据，所以我们需要给散点的图标增加一个配置，coordinateSystem:geo
					return {
						type: 'effectScatter',
						// 涟漪效果
						rippleEffect: {
							scale: 5,
							// 空心的涟漪效果
							brushType: 'stroke'
						},
						name: item.name,
						data: item.children,
						coordinateSystem: 'geo'
					}
				});
				const dataOption = {
					series: seriesArr,
					legend: {
						data: legendArr
					}
				};
				this.chartInstance.setOption(dataOption);
			},
			screenAdapter() {
				const titleFontSize = this.$refs.mapRef.offsetWidth / 100 * 3.6;
				const adapterOption = {
					title: {
						textStyle: {
							fontSize: titleFontSize
						}
					},
					legend: {
						itemWidth: titleFontSize / 2,
						itemHeight: titleFontSize / 2,
						// 图例之间的间隔
						itemGap: titleFontSize / 2,
						textStyle: {
							fontSize: titleFontSize / 2
						}
					}
				};
				this.chartInstance.setOption(adapterOption);
				this.chartInstance.resize();
			},
			revertMap() {
				const revertOption = {
					geo: {
						map: 'china'
					}
				};
				this.chartInstance.setOption(revertOption);
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
