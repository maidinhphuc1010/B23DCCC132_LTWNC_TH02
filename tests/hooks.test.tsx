import { act, renderHook } from '@testing-library/react-hooks';
import { useDebounce, useAssignmentFilters } from '@/features/assignments/hooks';
import { ThemeProvider, useTheme } from '@/features/assignments/theme';
import type { Assignment } from '@/features/assignments/types';

describe('useDebounce with fake timers', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test('returns initial value, waits 300ms and resets timer after rapid typing', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => useDebounce(value), { initialProps: { value: '' } });
    expect(result.current).toBe('');
    rerender({ value: 'r' });
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('');
    rerender({ value: 'react' });
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('');
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('react');
    unmount();
  });
  test('custom delay updates and unmount cancels pending timer', () => {
    const { result, rerender, unmount } = renderHook(({ value, delay }) => useDebounce(value, delay), { initialProps: { value: 1, delay: 100 } });
    rerender({ value: 2, delay: 500 });
    act(() => { jest.advanceTimersByTime(100); });
    expect(result.current).toBe(1);
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe(2);
    rerender({ value: 3, delay: 500 });
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

test('filters by status and case-insensitive trimmed subject/title search', () => {
  const base: Assignment = { id: 'a', title: 'React', subject: 'Web', dueDate: '2099-01-01', priority: 'low', completed: false };
  const items = [base, { ...base, id: 'b', completed: true }, { ...base, id: 'c', title: 'SQL', dueDate: '2000-01-01' }];
  const { result, rerender } = renderHook(({ query }) => useAssignmentFilters(items, query), { initialProps: { query: '' } });
  expect(result.current.filteredAssignments).toHaveLength(3);
  act(() => result.current.setStatus('completed'));
  expect(result.current.filteredAssignments.map(item => item.id)).toEqual(['b']);
  act(() => result.current.setStatus('pending'));
  expect(result.current.filteredAssignments.map(item => item.id)).toEqual(['a']);
  act(() => result.current.setStatus('overdue'));
  expect(result.current.filteredAssignments.map(item => item.id)).toEqual(['c']);
  act(() => result.current.setStatus('all'));
  rerender({ query: ' REACT ' });
  expect(result.current.filteredAssignments.map(item => item.id)).toEqual(['a', 'b']);
  rerender({ query: 'web' });
  expect(result.current.filteredAssignments).toHaveLength(3);
  rerender({ query: 'missing' });
  expect(result.current.filteredAssignments).toEqual([]);
});
test('theme provider toggles light, dark, light', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
  expect(result.current.mode).toBe('light');
  act(() => result.current.toggleTheme());
  expect(result.current.mode).toBe('dark');
  act(() => result.current.toggleTheme());
  expect(result.current.mode).toBe('light');
});
