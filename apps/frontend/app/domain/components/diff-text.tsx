import { Text } from '@mantine/core';

import { diffWordsWithSpace } from 'diff';

import { memo, useMemo } from 'react';

export const DiffText = memo(function DiffText({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWordsWithSpace(before ?? '', after ?? ''), [before, after]);
  return (
    <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
      {parts.map((part, idx) => {
        const bg = part.added ? 'rgba(64, 192, 87, 0.18)' : part.removed ? 'rgba(250, 82, 82, 0.16)' : undefined;
        const decoration = part.removed ? 'line-through' : undefined;
        return (
          <Text
            key={idx}
            span
            style={{
              background: bg,
              textDecoration: decoration,
            }}
          >
            {part.value}
          </Text>
        );
      })}
    </Text>
  );
});
