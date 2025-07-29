import {
	defineStyleConfig,
	extendTheme,
	FormControlProps,
	FormLabelProps
} from '@chakra-ui/react';
import { theme as originTheme } from '@sealos/ui';
import Button from './Button';
import Tabs from './Tabs';



const FormControl = defineStyleConfig<FormControlProps, {}, {}>({
  baseStyle: {
    fontSize: '12px',
    fontWeight: '500',
    m: '0'
  }
});
const FormLabel = defineStyleConfig<FormLabelProps, {}, {}>({
  baseStyle: {
    fontSize: '12px',
    fontWeight: '500',
    m: '0'
  }
});
export const theme = extendTheme(originTheme, {
  components: {
    Button,
    // FormControl,
    FormLabel,
    Tabs
  },
  breakpoints: {
    base: '0em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em'
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: '#F5F5F5',
        color: 'grayModern.900'
      }
    }
  },
  fonts: {
    '*': `'PingFang SC'`,
    div: `'PingFang SC'`
  }
});
