import { Box, Flex, FormLabel, TabPanel, TabPanelProps } from '@chakra-ui/react';
import { subDays } from 'date-fns';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import { api } from '~/utils/api';
import SelectRange, { type SelectRangeRef } from '../common/SelectDateRange';
const CostChart = dynamic(() => import('./PieChart'), { ssr: false });

export default function CostOverviewPanel(props: TabPanelProps) {
	const ref = useRef<SelectRangeRef>(null);
	const [range, setRange] = useState({
		from: subDays(new Date(), 1),
		to: new Date()
	});
	const result = api.user.getCost.useQuery({
		startTime: range.from,
		endTime: range.to,
	});
	const formatMoney = (price: number) => {
		return price / 1_000_000;
	};
	const {t} = useTranslation()
	const data = useMemo(() => {
		return [
			[t("common:system_plugin"), formatMoney(result.data?.cost?.systemCost ?? 0).toFixed(2)],
			[t("common:internal_employee_consumption"), formatMoney(0).toFixed(2)],
			[t("common:user_consumption"), formatMoney(result.data?.cost?.userCost ?? 0).toFixed(2)],
			[t("common:application_plugin"), formatMoney(0).toFixed(2)]
		] as [string, string][];
	}, [result.data?.cost?.systemCost, result.data?.cost?.userCost, t]);
	return (
		<TabPanel {...props} h={'full'} flex={1} >
			<Flex gap={'24px'} align={'center'}>
				<FormLabel>{t("common:time")}</FormLabel>
				<SelectRange range={range} onRangeUpdate={setRange} ref={ref} />
			</Flex>
			<Box overflow={'auto'} flex={'auto'} w={'full'}>
				<CostChart data={data} />
			</Box>
		</TabPanel>
	);
}
