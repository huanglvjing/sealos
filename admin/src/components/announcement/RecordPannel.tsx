import { Flex, FormControl, Input, InputGroup, InputLeftElement, TabPanel, Text } from "@chakra-ui/react";
import { SearchIcon } from "@sealos/ui";
import { produce } from "immer";
import { useTranslation } from "next-i18next";
import { startTransition, useEffect, useState } from "react";
import { api, RouterOutputs } from "~/utils/api";
import RegionMenu from "../common/menu/RegionMenu";
import SwitchInfinitePage from "../common/SwitchInfinitePage";
import { AnnouncementTable } from "./AnnouncementTable";
export default function RecordPannel() {
	const [pageState, setPageState] = useState({
		pageSize: 500,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	const {t} = useTranslation()
	const [region, setRegion] = useState<RouterOutputs['base']['getRegionList'][number] | undefined>(undefined);
	// reset pageIdx to 1 when the region changes
	useEffect(() => {
		setPageState((state) => produce(state, (draft) => {
			draft.pageIndex = 1;
			return draft;
		}))
	}, [region]);

	const query = api.announcement.listAnnouncement.useInfiniteQuery({
		pageSize: pageState.pageSize,
		regionUid: region?.uid,
	}, {
		getNextPageParam(lastPage) {
			return lastPage.nextCursor
		},
	});
	useEffect(() => {
		if (!query.isSuccess || !query.data) return;
		setPageState((state) => produce(state, (draft) => {
			draft.totalPage =query.data.pages.length + (query.hasNextPage ? 1 : 0);
			if (query.data.pages.length === 0) return draft;
			return draft;
		}))
	}, [query.data, query.hasNextPage, query.isSuccess]);
	const data = query.data?.pages[pageState.pageIndex - 1]?.list ?? [];
	const [columnFilters, setColumnFilters] = useState<
	[
		{
			id: 'message',
			value: string
		},
	]>([{
		id:'message',
		value: ''
	}]);
	return <TabPanel p={'0'} h={'full'} flex={'1'} display={'flex'} flexDirection={'column'}>
		<Flex wrap={'wrap'} gap={'16px'} my={'20px'}>
			<FormControl
				display={'flex'}
				alignItems={'center'}
				width={'auto'}
				mr={'16px'}
				justifyContent={'space-between'}
			>
				<Flex gap={'32px'} align={'center'} >
					<Text fontSize={'12px'} fontWeight={'500'}>
						{t('common:region')}
					</Text>
					<RegionMenu region={region} onUpdateRegion={setRegion} isDisabled={false} width="240px" />
				</Flex>
			</FormControl>
			<FormControl
				display={'flex'}
				alignItems={'center'}
				width={'auto'}
				mr={'16px'}
				justifyContent={'space-between'}
			>
				<InputGroup>
				<InputLeftElement>
				<SearchIcon boxSize={'16px'} color={'grayModern.600'} />
				</InputLeftElement>ß
				<Input onChange={(e) => startTransition(
					() => {
						setColumnFilters([
							{
								id: 'message',
								value: e.target.value
							}
						])
					})} type="text" width={'280px'} placeholder={t("announcement:announcement_search")} />
				</InputGroup>
			</FormControl>
		</Flex>
		<AnnouncementTable data={data} h={'0'} flex={'auto'} mt='4px' columnFilters={columnFilters} />
		<SwitchInfinitePage currentPage={pageState.pageIndex} totalPage={pageState.totalPage} pageSize={pageState.pageSize}
					setLastedPage={async function () {
						const hasNextPage = query.hasNextPage;
						let endPage = pageState.totalPage;
						if (hasNextPage) {
							const result = await query.fetchNextPage();
							endPage = result.hasNextPage ? pageState.totalPage + 1 : pageState.totalPage;
						}
						setPageState(s => produce(s, (draft) => {
							draft.pageIndex = endPage;
							return draft;
						}));
					}} setFirstPage={async function () {
						setPageState(produce((draft) => {
							draft.pageIndex = 1;
							return draft
						}));
					}} setPreviousPage={async function () {
						setPageState(produce(pageState, (draft) => {
							draft.pageIndex -= 1;
							return draft
						}));
					}} setNetxPage={async function () {
						const hasNextPage = query.hasNextPage;
						if (hasNextPage) {
							await query.fetchNextPage();
						}
						setPageState(s => produce(s, (draft) => {
							draft.pageIndex += 1;
							return draft
						}));
					}} />
	</TabPanel>
}