import { tabsAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const tabsHelper = createMultiStyleConfigHelpers(tabsAnatomy.keys);
const primaryTabs = tabsHelper.definePartsStyle({
  tablist: {
    // borderColor: '#EFF0F1',
    alignItems: 'center',
    // border: 'unset',
    gap: '16px',
		borderBottom:"1px solid",
		borderColor: 'grayModern.200',
    fontWeight: '500',
  },
  tab: {
    fontWeight: '500',
    fontSize: '16px',
    px: '4px',
    py: '12px',
    borderBottom: '1.5px solid',
    gap: '8px',
    borderColor: 'transparent',
    color: 'grayModern.500',
    _selected: { color: 'grayModern.900', borderColor: 'grayModern.900' },
    _active: {
      color: 'unset',
    },
		_hover:{
			borderColor: 'grayModern.900'
		}
  },
  tabpanels: {
    mt: '12px'
  },
  tabpanel: {
    p: 0
  }
});
const slideTabs = tabsHelper.definePartsStyle({
  tablist: {
    // borderColor: '#EFF0F1',
    alignItems: 'center',
    border: '1px solid',
    borderColor: 'grayModern.200',
    gap: '4px',
    display: 'inline-flex',
    w: 'max-content',
    borderRadius: '6px',
    p: '3px',
    fontWeight: '500',
    bgColor: 'grayModern.50'
  },
  tab: {
    fontWeight: '500',
    fontSize: '14px',
    py: '5px',
    px: '10px',
    color: 'grayModern.500',
    _selected: {
      color: 'grayModern.900',
      boxShadow: '0px 0px 1px 0px #13336B26; 0px 1px 2px 0px #13336B1A;',
      borderRadius: '4px',
      bgColor: 'white'
    },
    _active: {
      color: 'grayModern.900'
    },
		_hover:{
			color: 'brightBlue.600'
		}
  },
  tabpanels: {
    p: '0',
    display: 'flex',
    h: 'full',
    flexDirection: 'column',
    mt: '12px'
  },
  tabpanel: {
    display: 'flex',
    h: 'full',
    p: '0',
    flexDirection: 'column'
  }
});
const Tabs = tabsHelper.defineMultiStyleConfig({
  variants: {
    primary: primaryTabs,
    slide: slideTabs
  }
});
export default Tabs;
