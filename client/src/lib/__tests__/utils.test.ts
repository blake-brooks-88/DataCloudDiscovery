import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn()', () => {
  it('should merge multiple class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes with objects', () => {
    const result = cn('base-class', {
      'active-class': true,
      'inactive-class': false,
    });
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('inactive-class');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['text-lg', 'font-bold'], 'text-center');
    expect(result).toContain('text-lg');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-center');
  });

  it('should handle undefined inputs', () => {
    const result = cn('text-red-500', undefined, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle null inputs', () => {
    const result = cn('text-red-500', null, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle empty strings', () => {
    const result = cn('text-red-500', '', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should deduplicate conflicting Tailwind classes (twMerge behavior)', () => {
    // twMerge should resolve conflicting utilities, keeping the last one
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle complex combinations of inputs', () => {
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      {
        'conditional-true': true,
        'conditional-false': false,
      },
      undefined,
      null,
      '',
      'final-class'
    );

    expect(result).toContain('base-class');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
    expect(result).toContain('conditional-true');
    expect(result).not.toContain('conditional-false');
    expect(result).toContain('final-class');
  });

  it('should merge Tailwind variant classes correctly', () => {
    const result = cn('hover:bg-blue-500', 'hover:bg-red-500');
    // twMerge should keep the last conflicting class
    expect(result).toBe('hover:bg-red-500');
  });

  it('should handle nested arrays', () => {
    const result = cn([['nested-1', 'nested-2'], 'outer']);
    expect(result).toContain('nested-1');
    expect(result).toContain('nested-2');
    expect(result).toContain('outer');
  });

  it('should preserve non-conflicting Tailwind classes', () => {
    const result = cn('text-sm font-bold', 'text-center text-red-500');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-center');
    expect(result).toContain('text-red-500');
    // text-sm should be removed by text-red-500 (both are text-size utilities)
  });

  it('should handle boolean false values', () => {
    const result = cn('class-1', false, 'class-2');
    expect(result).toBe('class-1 class-2');
  });

  it('should handle multiple conflicting utilities', () => {
    const result = cn('p-2 m-2 text-sm', 'p-4 m-4 text-lg');
    // twMerge resolves conflicts - later values win for conflicting utilities
    expect(result).toBe('p-4 m-4 text-lg');
  });
});
