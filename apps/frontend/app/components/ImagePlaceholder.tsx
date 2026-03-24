import { Box, Center, type BoxProps } from '@mantine/core';

import { MdImage } from 'react-icons/md';

type ImagePlaceholderProps = BoxProps & {
  iconSize?: number;
};

export function ImagePlaceholder({ iconSize = 40, style, ...props }: ImagePlaceholderProps) {
  return (
    <Box
      {...props}
      style={[
        {
          backgroundColor: 'var(--mantine-color-gray-1)',
          border: '1px solid var(--mantine-color-gray-3)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Center h="100%" w="100%">
        <MdImage size={iconSize} color="var(--mantine-color-gray-6)" aria-hidden />
      </Center>
    </Box>
  );
}
