// import useSessionStore from '@/stores/session';
import { Box, Flex } from '@chakra-ui/react';
import SideBar from './sidebar';

export default function Layout({ children }: any) {
  return (
    <Flex
      w="100vw"
      h="100vh"
      position="relative"
      background={'grayModern.100'}
      pt={'4px'}
      pb="10px"
      alignItems={'center'}
      justifyContent={'center'}
    >
      <Flex width="full" height="full" maxWidth="1600px" justify={'center'}>
        <SideBar />
        <Box flexGrow={1} borderRadius="8px" overflow={'hidden'} w={0} bgColor={'white'}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
