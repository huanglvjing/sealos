import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const detailButton = defineStyle({
	color: 'grayModern.900',
	fontStyle: "normal",
	fontWeight: "500",
	fontSize: "11px",
	border: 'unset',
	bg: 'grayModern.150',
	px: '12px',
	py: '6px',
	borderRadius: '4px',
	_hover: {
		color: 'brightBlue.600'
	}
})
const menuItemButton = defineStyle({
  minW: 'unset',
  borderRadius: '4px',
  minH: 'unset',
  h: 'auto',
  w: 'full',
  m: '0',
  px: '4px',
  py: '6px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'grayModern.600',
  justifyContent: 'flex-start',
  _hover: {
    backgroundColor: '#1118240D',
    color: 'brightBlue.600'
  }, 
});
const menuItemErrorButton = defineStyle({
  minW: 'unset',
  borderRadius: '4px',
  minH: 'unset',
  h: 'auto',
  w: 'full',
  m: '0',
  px: '4px',
  py: '6px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'grayModern.600',
  justifyContent: 'flex-start',
  _hover: {
    backgroundColor: '#1118240D',
    color: '#D92D20'
  }, 
});
const Button = defineStyleConfig({
  variants: {
    solid: {
      minW: 'unset'
    },
    'menu-item': menuItemButton,
		'menu-item-error': menuItemErrorButton,
		'detail': detailButton
  }
});
export default Button