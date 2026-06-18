import { describe, it, expect, vi } from 'vitest';
import { cx, resolveIcon } from './ui';

describe('cx', () => {
  it('joins truthy class names with spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values (undefined, null, false, empty string)', () => {
    expect(cx('a', undefined, null, false, '', 'b')).toBe('a b');
  });

  it('returns empty string when nothing is truthy', () => {
    expect(cx(undefined, null, false)).toBe('');
  });
});

describe('resolveIcon', () => {
  it('returns undefined for falsy input', () => {
    expect(resolveIcon(undefined)).toBeUndefined();
  });

  it('looks up a bare icon name in the registry', () => {
    expect(resolveIcon('stone')).toBe('/icons/16/stone.png');
  });

  it('resolves brand icons by name', () => {
    expect(resolveIcon('logo-mark')).toBe('/icons/brand/logo-mark.png');
  });

  it('passes through values containing "." (path/URL) untouched', () => {
    expect(resolveIcon('./local.png')).toBe('./local.png');
    expect(resolveIcon('https://x.test/a.png')).toBe('https://x.test/a.png');
  });

  it('passes through values containing "/" untouched', () => {
    expect(resolveIcon('/abs/path.png')).toBe('/abs/path.png');
  });

  it('warns and returns undefined for an unknown bare name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 등록되지 않은 이름 — resolveIcon은 string도 받으므로 타입상 유효, 런타임에 undefined
    expect(resolveIcon('does-not-exist')).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
