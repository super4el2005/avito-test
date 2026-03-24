import { beforeEach, describe, expect, it } from 'vitest';

import { useUiPreference } from './useUiPreference';

import { act, renderHook } from '@testing-library/react';

describe('useUiPreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses default value when storage is empty', () => {
    const { result } = renderHook(() =>
      useUiPreference({
        key: 'view-mode',
        defaultValue: 'grid',
      }),
    );

    expect(result.current[0]).toBe('grid');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() =>
      useUiPreference({
        key: 'view-mode',
        defaultValue: 'grid',
      }),
    );

    act(() => {
      result.current[1]('list');
    });

    expect(localStorage.getItem('view-mode')).toBe('"list"');
    expect(result.current[0]).toBe('list');
  });
});
