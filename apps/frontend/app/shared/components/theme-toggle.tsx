import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core';

import { MdDarkMode, MdLightMode } from 'react-icons/md';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
      <Tooltip label={isDark ? 'Светлая тема' : 'Тёмная тема'} withArrow position="left">
        <ActionIcon size="lg" radius="md" variant="default" aria-label="Переключить тему" onClick={() => toggleColorScheme()}>
          {isDark ? <MdLightMode /> : <MdDarkMode />}
        </ActionIcon>
      </Tooltip>
    </div>
  );
}
