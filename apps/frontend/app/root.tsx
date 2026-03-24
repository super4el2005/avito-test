import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import {
  ActionIcon,
  ColorSchemeScript,
  localStorageColorSchemeManager,
  mantineHtmlProps,
  MantineProvider,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import type { Route } from './+types/root';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      retry: 0,
      refetchOnReconnect: false,
    },
  },
});

const colorSchemeManager = localStorageColorSchemeManager({ key: 'color-scheme' });

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
      <Tooltip label={isDark ? 'Светлая тема' : 'Тёмная тема'} withArrow position="left">
        <ActionIcon
          size="lg"
          radius="md"
          variant="default"
          aria-label="Переключить тему"
          onClick={() => toggleColorScheme()}
        >
          {isDark ? <MdLightMode /> : <MdDarkMode />}
        </ActionIcon>
      </Tooltip>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider colorSchemeManager={colorSchemeManager} defaultColorScheme="auto">
        <Notifications />
        <ThemeToggle />
        <Outlet />
      </MantineProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
