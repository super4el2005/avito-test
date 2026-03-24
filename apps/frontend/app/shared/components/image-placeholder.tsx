import { Center, Paper, type PaperProps } from '@mantine/core';

import { MdImage } from 'react-icons/md';

type ImagePlaceholderProps = PaperProps & {
  iconSize?: number;
};

export function ImagePlaceholder({ iconSize = 40, ...props }: ImagePlaceholderProps) {
  return (
    <Paper
      shadow="xs"
      radius="md"
      p="md"
      {...props}
    >
      <Center h="100%" w="100%">
        <MdImage size={iconSize} aria-hidden />
      </Center>
    </Paper>
  );
}
