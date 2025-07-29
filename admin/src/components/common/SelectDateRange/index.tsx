// import { CalendarIcon } from '@chakra-ui';
import {
	Box,
	Button,
	Flex,
	FlexProps,
	forwardRef,
	IconButton,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Table,
	Td,
	useDisclosure,
	useToken
} from '@chakra-ui/react';
import { endOfDay, format, isAfter, isBefore, isValid, parse, startOfDay } from 'date-fns';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { ForwardedRef, useEffect, useImperativeHandle, useState } from 'react';
import { DateRange, DayPicker, OnSelectHandler, UI } from 'react-day-picker';
import LogIcon from '../icon/LogIcon';
import ToIcon from '../icon/ToIcon';
export type SelectRangeRef = {
	selectedRange: () => {
		from: Date;
		to: Date;
	};
};
const initDate = new Date();
const SelectRange = forwardRef(function SelectRange(
	{
		isDisabled = false,
		lockStart = false,
		range = { from: startOfDay(initDate), to: endOfDay(initDate) },
		onRangeUpdate,
		...props
	}: {
		isDisabled?: boolean;
		lockStart?: boolean;
		range: { from: Date; to: Date };
		onRangeUpdate?: (range: { from: Date; to: Date }) => void;
	} & FlexProps,
	ref: ForwardedRef<SelectRangeRef>
) {
	const [fontColor] = useToken('colors', ['grayModern.900']);
	const [selectedRange, _setSelectedRange] = useState(range);
	const setSelectedRange = (range: { from: Date; to: Date }) => {
		_setSelectedRange({
			from: startOfDay(range.from),
			to: endOfDay(range.to)
		});
		onRangeUpdate?.(range);
	};
	const [selectedPickerRange, setSelectedPickerRange] = useState<DateRange>(selectedRange);

	useImperativeHandle(
		ref,
		() => ({
			selectedRange() {
				return selectedRange;
			}
			// setSelectedRange
		}),
		[selectedRange]
	);
	const resetPickerRange = () => {
		setSelectedPickerRange({
			from: selectedRange.from,
			to: selectedRange.to
		});
	};
	const disclosure = useDisclosure();
	const [fromValue, setFromValue] = useState<string>(format(selectedRange.from, 'yyyy/MM/dd'));
	const [toValue, setToValue] = useState<string>(format(selectedRange.to, 'yyyy/MM/dd'));
	const handleRangeSelect: OnSelectHandler<DateRange | undefined> = (range, day, modifiers) => {
		// before confirm
		const updatePickerRange = (key: 'from' | 'to', value: Date) => {
			setSelectedPickerRange(
				produce(selectedPickerRange, (draft) => {
					draft[key] = value;
					return draft;
				})
			);
		};
		// Reset logic based on modifiers
		if (modifiers.range_start) {
			updatePickerRange('to', day);
		} else if (
			modifiers.range_end ||
			isBefore(day, selectedPickerRange.from ?? selectedRange.from)
		) {
			updatePickerRange('from', day);
		} else {
			updatePickerRange('to', day);
		}
	};

	useEffect(() => {
		setFromValue(format(selectedRange.from, 'yyyy/MM/dd'));
		setToValue(format(selectedRange.to, 'yyyy/MM/dd'));
		setSelectedPickerRange(selectedRange);
	}, [selectedRange]);
	const { t } = useTranslation();
	return (
		<Flex
			bg="grayModern.50"
			w={'fit-content'}
			align={'center'}
			px={'12px'}
			py={'6px'}
			justify={'space-between'}
			border={'1px solid'}
			borderColor={'grayModern.200'}
			borderRadius="6px"
			color={'grayModern.900'}
			{...props}
		>
			{/* for the from input field */}
			<Box flex={1} position={'relative'} h={'20px'} fontSize={'12px'}>
				{fromValue}
				<Input
					left={0}
					position={'absolute'}
					isDisabled={!!isDisabled || lockStart}
					variant={'unstyled'}
					color={'transparent'}
					style={{
						font: 'inherit',
						caretColor: fontColor
					}}
					h={'20px'}
					value={fromValue}
					width={'full'}
					onChange={(e) => {
						setFromValue(e.target.value);
					}}
					onBlur={(e) => {
						const val = parse(e.target.value, 'yyyy/MM/dd', initDate);
						if (!isValid(val) || isAfter(val, toValue))
							return setFromValue(format(selectedRange.from, 'yyyy/MM/dd'));
						// update selected range
						const range = produce(selectedRange, (draft) => {
							draft.from = val;
							return draft;
						});
						setSelectedRange(range);
					}}
				/>
			</Box>
			{/* for the to input field */}
			<ToIcon boxSize={'16px'} mx={'10px'} color={'grayModern.500'} fill={'currentcolor'} />
			<Box flex={1} position={'relative'} h={'20px'} fontSize={'12px'}>
				{toValue}
				<Input
					left={0}
					position={'absolute'}
					isDisabled={!!isDisabled}
					variant={'unstyled'}
					color={'transparent'}
					style={{
						font: 'inherit',
						caretColor: fontColor
					}}
					// flex={1}
					h={'20px'}
					value={toValue}
					// minW="90px"
					width={'full'}
					onChange={(e) => {
						setToValue(e.target.value);
					}}
					onBlur={(e) => {
						const val = parse(e.target.value, 'yyyy/MM/dd', initDate);
						if (!isValid(val) || isBefore(val, selectedRange.from))
							return setToValue(format(selectedRange.to, 'yyyy/MM/dd'));
						// update selected range
						const range = produce(selectedRange, (draft) => {
							draft.to = val;
							return draft;
						});
						setSelectedRange(range);
					}}
				/>
			</Box>

			<Popover
				onClose={() => {
					resetPickerRange();
					disclosure.onClose();
				}}
				onOpen={() => {
					resetPickerRange();
					disclosure.onOpen();
				}}
				isOpen={disclosure.isOpen}
			>
				<PopoverTrigger>
					<IconButton
						onClick={() => {
							disclosure.onOpen();
						}}
						ml={'4px'}
						display={'flex'}
						variant={'unstyled'}
						aria-label={'open'}
						icon={<LogIcon boxSize={'16px'} fill={'grayModern.500'} />}
						boxSize={'16px'}
						minW={'unset'}
					></IconButton>
				</PopoverTrigger>
				<PopoverContent zIndex={99} w={'auto'} p="20px 24px">
					<DayPicker
						mode="range"
						required
						selected={selectedPickerRange}
						onSelect={handleRangeSelect}
						styles={{
							[UI.Nav]: {
								display: 'flex',
								position: 'absolute',
								top: '14px',
								right: '24px',
								gap: '12px'
							},
							[UI.Chevron]: {
								width: '24px',
								height: '24px'
							},
							[UI.CaptionLabel]: {
								fontSize: '18px',
								fontWeight: 500
							},
							[UI.Weekday]: {
								fontSize: '14px',
								fontWeight: 500,
								height: '36px'
							},
							[UI.Root]: {
								color: fontColor
							}
						}}
						components={{
							// must use Chakra Table to replace default Table
							// ({orientation, size, ...props}) {
							// 		return <IconButton aria-label={'switch-page'} {...props} variant={'square'} boxSize={'36px'} icon={<LeftArrowIcon boxSize={'24px'}/>}/>
							// },
							NextMonthButton(props) {
								return <IconButton aria-label={'switch-page'} {...props} variant={'square'} boxSize={'36px'} borderRadius={'6px'} />;
							},
							PreviousMonthButton(props) {
								return <IconButton aria-label={'switch-page'} {...props} variant={'square'} boxSize={'36px'} borderRadius={'6px'} />;
							},
							MonthGrid({ ...props }) {
								return <Table variant={'unstyled'} {...props} isTruncated width={'auto'} />;
							},
							Day({ modifiers, day, ...props }) {
								return <Td {...props} p={'0'} />;
							},
							DayButton(props) {
								const { day, modifiers, ...buttonProps } = props;

								return (
									<Button
										{...buttonProps}
										variant={'unstyled'}
										// Prevent the default click event
										onClick={(e) => {
											buttonProps.onClick?.(e);
										}}
										isDisabled={lockStart && modifiers.range_end}
										fontWeight={400}
										fontSize={'14px'}
										boxSize={'36px'}
										minW={'unset'}
										hidden={modifiers.outside}
										color={
											modifiers.range_start || modifiers.range_end ? 'white' : 'grayModern.900'
										}
										_hover={
											!modifiers.selected ? {
												bgColor: '#1118240D'
											} : {}
										}

										bgColor={
											modifiers.range_start || modifiers.range_end
												? 'grayModern.900'
												: modifiers.range_middle
													? 'grayModern.150'
													: ''
										}
										borderLeftRadius={modifiers.range_start || !modifiers.selected ? '8px' : 'unset'}
										borderRightRadius={modifiers.range_end || !modifiers.selected ? '8px' : 'unset'}
									/>
								);
							}
						}}
					/>
					<Flex>
						<Button
							px="14px"
							py={'8px'}
							variant={'outline'}
							onClick={resetPickerRange}
						>
							{t('common:reset')}
						</Button>
						<Flex ml={'auto'} gap={'12px'}>

							<Button
								px="14px"
								py={'8px'}
								variant={'outline'}
								onClick={() => {
									resetPickerRange();
									disclosure.onClose();
								}}
							>
								{t('common:cancel')}
							</Button>
							<Button
								px="14px"
								py={'8px'}
								variant={'solid'}
								onClick={() => {
									const range = produce(selectedRange, (draft) => {
										if (selectedPickerRange.from) draft.from = selectedPickerRange.from;
										if (selectedPickerRange.to) draft.to = selectedPickerRange.to;
										return draft;
									});
									setSelectedRange(range);
									disclosure.onClose();
								}}
								bgColor={'grayModern.900'}
							>
								{t('common:confirm')}
							</Button>
						</Flex>
					</Flex>

				</PopoverContent>
			</Popover>
		</Flex>
	);
});

export default SelectRange;
