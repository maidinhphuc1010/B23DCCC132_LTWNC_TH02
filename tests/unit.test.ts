import { calcDaysLeft, calcStats, isOverdue } from '@/features/assignments/stats';
import reducer, { addAssignment, updateAssignment, toggleAssignment, removeAssignment, replaceAssignments, fetchAssignments } from '@/features/assignments/slice';
import { generateSampleAssignments } from '@/features/assignments/generator';
import { isAssignment, isPriority } from '@/features/assignments/types';
import type { Assignment } from '@/features/assignments/types';

const now = new Date('2026-10-13T12:00:00');
export const assignment: Assignment = { id: 'a', title: 'Bài React', subject: 'Web', dueDate: '2026-10-10', completed: false, priority: 'high' };

describe('date and statistics units', () => {
  test('calcDaysLeft rounds up remaining partial days', () => {
    expect(calcDaysLeft('2026-10-14', now)).toBe(2);
    expect(calcDaysLeft('2026-10-13', now)).toBe(1);
  });
  test('calcDaysLeft at exact deadline and invalid date', () => {
    expect(calcDaysLeft('2026-10-13', new Date('2026-10-13T23:59:59'))).toBe(0);
    expect(calcDaysLeft('invalid', now)).toBeNaN();
  });
  test('isOverdue excludes completed and future assignments', () => {
    expect(isOverdue(assignment, now)).toBe(true);
    expect(isOverdue({ ...assignment, completed: true }, now)).toBe(false);
    expect(isOverdue({ ...assignment, dueDate: '2026-10-14' }, now)).toBe(false);
  });
  test('documents existing ceil boundary: less than one day past deadline is not overdue', () => {
    expect(isOverdue({ ...assignment, dueDate: '2026-10-12' }, now)).toBe(false);
  });
  test('calcStats handles empty input', () => {
    expect(calcStats([], now)).toEqual({ total: 0, completed: 0, overdue: 0, bySubject: {} });
  });
  test('calcStats groups subjects and excludes completed from overdue', () => {
    expect(calcStats([assignment, { ...assignment, id: 'b', completed: true }, { ...assignment, id: 'c', subject: 'Toán', dueDate: '2026-10-20' }], now))
      .toEqual({ total: 3, completed: 1, overdue: 1, bySubject: { Web: 2, Toán: 1 } });
  });
});

describe('assignments reducer', () => {
  const initial = () => reducer(undefined, { type: 'unknown' });
  test('initial state and unknown action', () => {
    expect(initial()).toEqual({ items: [], status: 'idle' });
  });
  test('add assigns id and defaults to incomplete without mutating previous state', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123);
    const before = initial();
    const next = reducer(before, addAssignment({ title: 'New', subject: 'Web', dueDate: '2026-10-20', priority: 'low' }));
    expect(next.items[0]).toMatchObject({ id: '123', completed: false, title: 'New' });
    expect(before.items).toEqual([]);
  });
  test('update existing and ignore unknown id', () => {
    const before = reducer(initial(), replaceAssignments([assignment]));
    const changes = { title: 'Updated', subject: 'Toán', dueDate: '2026-10-20', priority: 'low' as const };
    expect(reducer(before, updateAssignment({ id: 'missing', changes }))).toEqual(before);
    expect(reducer(before, updateAssignment({ id: 'a', changes })).items[0]).toMatchObject(changes);
    expect(before.items[0].title).toBe('Bài React');
  });
  test('toggle twice restores value, unknown id is a no-op', () => {
    const before = reducer(initial(), replaceAssignments([assignment]));
    const next = reducer(before, toggleAssignment('a'));
    expect(next.items[0].completed).toBe(true);
    expect(reducer(next, toggleAssignment('a')).items[0].completed).toBe(false);
    expect(reducer(before, toggleAssignment('missing'))).toEqual(before);
  });
  test('remove existing and missing id, replace with empty clears error', () => {
    const before = reducer(initial(), replaceAssignments([assignment]));
    expect(reducer(before, removeAssignment('missing'))).toEqual(before);
    expect(reducer(before, removeAssignment('a')).items).toEqual([]);
    const failed = reducer(before, fetchAssignments.rejected(new Error('offline'), 'req'));
    expect(reducer(failed, replaceAssignments([]))).toEqual({ items: [], status: 'succeeded', error: undefined });
  });
  test('async lifecycle pending, fulfilled and rejected', () => {
    const loading = reducer(initial(), fetchAssignments.pending('req'));
    expect(loading.status).toBe('loading');
    const done = reducer(loading, fetchAssignments.fulfilled([assignment], 'req'));
    expect(done).toMatchObject({ status: 'succeeded', items: [assignment] });
    expect(reducer(loading, fetchAssignments.rejected(new Error('offline'), 'req'))).toMatchObject({ status: 'failed', error: 'Không thể tải danh sách bài tập.' });
  });
});

test('generator handles zero and generates 10000 unique valid assignments', () => {
  expect(generateSampleAssignments(0)).toEqual([]);
  const items = generateSampleAssignments();
  expect(items).toHaveLength(10000);
  expect(new Set(items.map(item => item.id)).size).toBe(10000);
  expect(items.every(isAssignment)).toBe(true);
});
test('type guards reject malformed values and invalid priorities', () => {
  expect(isAssignment(null)).toBe(false);
  expect(isAssignment({})).toBe(false);
  expect(isAssignment({ ...assignment, completed: 'yes' })).toBe(false);
  expect(isPriority('urgent')).toBe(false);
});
