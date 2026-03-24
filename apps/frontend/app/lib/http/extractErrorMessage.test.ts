import { describe, expect, it } from 'vitest';

import { extractErrorMessage } from './extractErrorMessage';

describe('extractErrorMessage', () => {
  it('returns string error from axios-like response', () => {
    const error = {
      response: {
        data: {
          error: 'Bad request',
        },
      },
    };

    expect(extractErrorMessage(error, 'Fallback')).toBe('Bad request');
  });

  it('serializes non-string error payload', () => {
    const error = {
      response: {
        data: {
          error: { code: 'VALIDATION_FAILED' },
        },
      },
    };

    expect(extractErrorMessage(error, 'Fallback')).toBe('{"code":"VALIDATION_FAILED"}');
  });

  it('returns fallback when shape is unknown', () => {
    expect(extractErrorMessage(new Error('Nope'), 'Fallback')).toBe('Fallback');
  });
});
