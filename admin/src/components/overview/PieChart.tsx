import { Box, Flex, Text } from '@chakra-ui/react';
import { PieSeriesOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { PieChart } from 'echarts/charts';
import {
	DatasetComponent,
	DatasetComponentOption,
	LegendComponent,
	LegendComponentOption,
	TooltipComponent,
	TooltipComponentOption
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import CurrencyIcon from '../common/icon/CurrencyIcon';
echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
  DatasetComponent
]);

type EChartsOptions = echarts.ComposeOption<
  LegendComponentOption | PieSeriesOption | TooltipComponentOption | DatasetComponentOption
>;

export default function CostChart({ data }: { data: [string, number | string][] }) {
  const { t } = useTranslation();
  const result = data;
  const title = t("common:cost_distribution");
  const source = useMemo(() => [['name', 'cost'], ...result], [result]);
  const option: EChartsOptions = {
    dataset: {
      source
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      top: 110,
      align: 'left',
      right: '8%',
      textStyle: {
        padding: [6, 6, 6, 6]
      },
      itemGap: 10,
      icon: 'path://M0.137085 2.0916748a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z'
    },
		
    color: ['#1D2532', '#009BDE', '#40C6FF', '#78D6FF'],
    series: [
      {
        type: 'pie',
				width: 240,
        label: {
          show: true,
          fontSize: 12,
          position: 'center',
          color: '#485264',
          // fontWidth: '500',
          // width: '500',
					fontWeight: 500,
          formatter: function (params: any) {
            return title;
          }
        },
        labelLine: {
          show: false
        },
        encode: {
          itemName: 'name',
          value: 'cost'
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0)'
        },
        tooltip: {
          show: true,
          borderColor: '#E8EBF0',
          borderRadius: 8,
          padding: 0,
          borderWidth: 0.5,
          formatter(params) {
            const data = params.data as [string, number | string];
            const tooltipContent = (
              // <Box p={'20px'} borderColor={'grayModern.200'} border={'0.5px solid'}>
              <Box padding={'20px'}>
                <Text fontSize={'12px'} fontWeight={500} color={'grayModern.900'}>
                  {title}
                </Text>
                <Flex
                  align={'center'}
                  gap={'8px'}
                  mt={'10px'}
                  color={'grayModern.900'}
                  fontSize={'12px'}
                >
                  <Box
                    bgColor={params.color?.toString()}
                    boxSize={'18px'}
                    borderRadius={'2px'}
                  ></Box>
                  <Text ml={'8px'}>{data[0]}</Text>
                  <Text fontWeight={500} ml={'39px'}>
                    {data[1]}
                  </Text>
                  <CurrencyIcon ml={'4px'} boxSize={'14px'} />
                </Flex>
              </Box>
            );
            const key = data[0] + 'tooltip';
            const container = document.getElementById(key) ?? document.createElement('div')!;
            container.setAttribute('style', '{padding: 0;}');
            container.setAttribute('id', key);
            createRoot(container).render(tooltipContent);
            return container;
          }
        },
        name: '',
				
        radius: ['58%', '100%'],
        avoidLabelOverlap: false,
        center: ['50%', '60%'],
        right: '20%',
				left: '20px',
        bottom: '20px',
        emptyCircleStyle: {
          borderCap: 'round'
        }
      }
    ]
  };
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      style={{
        // aspectRatio,
        width: '470px',
        // minWidth: '500px',
        height: '320px',
        margin: 'auto'
      }}
    />
  );
}
