import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputProps,
	NumberInputStepper
} from '@chakra-ui/react';
import CurrencyIcon from './icon/CurrencyIcon';
export default function MyNumberInput({
  // onChange,
  // value,
  needCurrencyIcon = true,
  ...props
}: NumberInputProps & {
	needCurrencyIcon?: boolean;
}) {
  // const inputRef = useRef<HTMLInputElement>(null);
  // const a = useNumberInput()
  return (
    <NumberInput
      clampValueOnBlur={false}
      step={1}
      min={0}
      w="104px"
      h="32px"
      boxSizing="border-box"
      background="grayModern.50"
      px={'12px'}
      py={'8px'}
      value={props.value}
      border="1px solid"
      borderColor={'grayModern.200'}
      borderRadius="6px"
      alignItems="center"
      display={'flex'}
      variant={'unstyled'}
      _hover={{
        borderColor: 'brightBlue.300'
      }}
      _focusWithin={{
        borderColor: 'brightBlue.500',
        boxShadow: '0px 0px 0px 2.4px #3370FF26;',
        bgColor: 'white'
      }}
      {...props}
    >
      <NumberInputField color={'grayModern.900'} borderRadius={'none'} fontSize={'12px'} />
      {needCurrencyIcon && <CurrencyIcon boxSize={'14px'} right={'32px'} position={'absolute'} />}
      <NumberInputStepper borderColor={'grayModern.200'}>
        <NumberIncrementStepper
          width={'24px'}
          borderColor={'grayModern.200'}
          h={'16px'}
          color={'grayModern.500'}
          _disabled={{
            cursor: 'not-allowed',
            borderColor: 'grayModern.200'
          }}
        >
          <ChevronUpIcon boxSize={'12px'} />
        </NumberIncrementStepper>
        <NumberDecrementStepper
          w="24px"
          borderColor={'grayModern.200'}
          h={'16px'}
          color={'grayModern.500'}
          _disabled={{
            borderColor: 'grayModern.200',
            cursor: 'not-allowed'
          }}
        >
          <ChevronDownIcon boxSize={'12px'} />
        </NumberDecrementStepper>
      </NumberInputStepper>
    </NumberInput>
  );
}
