import { ButtonGroup, Flex, IconButton, Popover, PopoverBody, PopoverContent, PopoverTrigger, Portal, TableContainerProps, Text } from '@chakra-ui/react';
import { MoreIcon } from '@sealos/ui';
import {
	ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { RouterOutputs } from '~/utils/api';
import { BaseTable } from '../common/table/BaseTable';
import AnnouncementDetailButton from './AnnouncementDetailButton';
import DeleteAnnouncementModal from './DeleteAnnouncementModal';
const HandleDelete = (props: { name: string, regionUid?: string }) => {
	return (
		<Popover>
			{({ isOpen, onClose }) => {
				return (
					<>
						<PopoverTrigger>
							<IconButton
								boxSize={'24px'}
								variant={'square'}
								minW={'unset'}
								icon={<MoreIcon boxSize={'16px'}></MoreIcon>}
								aria-label={'handle'}
							></IconButton>
						</PopoverTrigger>
						<Portal>
							<PopoverContent
								p="0"
								boxShadow={'0px 0px 1px 0px #13336B1A;0px 4px 10px 0px #13336B1A;'}
								w={'auto'}
							>
								<PopoverBody p={'0'}>
									<ButtonGroup
										p={'6px'}
										spacing={'0'}
										gap={'2px'}
										w={'100px'}
										variant={'menu-item-error'}
										display={'flex'}
										flexDir={'column'}
										alignItems={'flex-start'}
									>
										<DeleteAnnouncementModal announcementName={props.name}
											regionUid={props.regionUid}
											onClick={onClose} />
									</ButtonGroup>
								</PopoverBody>
							</PopoverContent>
						</Portal>
					</>
				);
			}}
		</Popover>
	);
};
export function AnnouncementTable({
	data,
	onSelect,
	regionUid,
	columnFilters,
	...props
}: {
	data: RouterOutputs['announcement']['listAnnouncement']['list'];
	regionUid?: string;
	onSelect?: (type: boolean, item: any) => void;
	columnFilters: ColumnFiltersState;
} & TableContainerProps) {
	const { t } = useTranslation();
	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<RouterOutputs['announcement']['listAnnouncement']['list'][number]>();
		return [
			columnHelper.accessor((row) => row.type, {
				id: 'type',
				header: t('announcement:announcement_type._self'),
				cell(props) {
					return <Text fontWeight={500} color={'grayModern.900'}>{t(`announcement:announcement_type.${props.cell.getValue()}`)}</Text>;
				}
			}),
			columnHelper.accessor((row) => row.createAt, {
				id: 'createAt',
				header: t('common:time'),
				cell(props) {
					const time = props.cell.getValue();
					return <Text>{time ? format(new Date(time), 'yyyy-MM-dd') : '-'}</Text>;
				}
			}),
			columnHelper.accessor((row) => row.title, {
				id: 'message',
				header: t('common:content'),
				cell(props) {
					return <Text
						overflow={'hidden'}
						textOverflow="ellipsis"
						whiteSpace="nowrap"
						maxW={'300px'}>{props.cell.getValue()}</Text>;
				}
			}),
			columnHelper.display({
				id: 'handle',
				header: t('common:handle'),
				cell(props) {
					// const row.spec = props.cell.getValue();
					const name = props.row.original.name!;
					return (
						<Flex gap={'4px'}>
							<AnnouncementDetailButton announcementName={name} />
							<HandleDelete name={name}
								regionUid={regionUid}
							/>
						</Flex>
					);
				},
				enablePinning: true
			})
		];
	}, [t, regionUid]);
	console.log(columnFilters)
	const table = useReactTable({
		data,
		initialState: {
			sorting: [
				{
					desc: true,
					id: 'createAt'
				}
			],
			columnPinning: {
				left: ['type'],
				right: ['handle']
			},
		},
		state: {

			columnFilters,
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});
	return <BaseTable {...props} table={table}></BaseTable>;
}