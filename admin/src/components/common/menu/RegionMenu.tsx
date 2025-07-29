import { FlexProps } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { api, RouterOutputs } from '~/utils/api';
import BaseMenu from './BaseMenu';
export type RegionMenuRef = {
	getCurRegion: () => RouterOutputs['base']['getRegionList'][number] | undefined;
};
function RegionMenu({
	isDisabled,
	width = '360px',
	region,
	onUpdateRegion,
	...props
}: {
	region: RouterOutputs['base']['getRegionList'][number] | undefined;
	onUpdateRegion: (region: RouterOutputs['base']['getRegionList'][number] | undefined) => void;
	isDisabled: boolean;
} & FlexProps) {
	const [regionIdx, setRegion] = useState(-1);
	const [regionList, setRegionList] = useState<RouterOutputs['base']['getRegionList']>([])
	const query = api.base.getRegionList.useQuery();
	const { isSuccess, isFetching, isError } = query;
	useEffect(() => {
		if (isSuccess && query.data) {
			setRegionList([...query.data]);
		}
	}, [query.data, isSuccess])
	useEffect(() => {
		// make sure once
		if(isFetching || isError || !regionList || regionIdx !== -1) return;
		const index = region ? regionList.findIndex((v) => v.uid === region.uid) : -1;
		if (index !== -1) {
			if (index !== regionIdx) {
				setRegion(index);
				onUpdateRegion(regionList[index]);
			}
		} else {
			setRegion(0);
			onUpdateRegion(regionList[0]);
		}
	}, [isError, isFetching, regionIdx, regionList])
	const itemList = regionList?.map((v) => v.displayName) ?? [];


	return (
		<BaseMenu
			itemIdx={regionIdx}
			isDisabled={isDisabled || isFetching}
			setItem={(idx: number)=>{
				setRegion(idx);
				const region = regionList?.[idx];
				onUpdateRegion(region);
			}}
			itemlist={itemList}
			innerWidth={width}
		/>
	);
}

export default RegionMenu;
