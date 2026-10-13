import { useEffect, useMemo, useState } from 'react';
import type { Assignment, AssignmentStatus } from './types';
import { calcDaysLeft, isOverdue } from './stats';

export const useDebounce = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const getDateDiff = calcDaysLeft;

export const useAssignmentFilters = (assignments: Assignment[], query = '') => {
  const [status, setStatus] = useState<AssignmentStatus>('all');
  const filteredAssignments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const overdue = isOverdue(assignment);
      const matchesQuery = !normalizedQuery || `${assignment.subject} ${assignment.title}`.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (status === 'completed') return assignment.completed;
      if (status === 'pending') return !assignment.completed && !overdue;
      if (status === 'overdue') return overdue;
      return true;
    });
  }, [assignments, query, status]);
  return { status, setStatus, filteredAssignments };
};

