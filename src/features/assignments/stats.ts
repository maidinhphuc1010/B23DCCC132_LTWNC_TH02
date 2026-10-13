import type { Assignment } from './types';

export const calcDaysLeft = (dueDate: string, today = new Date()): number => {
  const due = new Date(`${dueDate}T23:59:59`);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};

export const isOverdue = (assignment: Pick<Assignment, 'dueDate' | 'completed'>, today = new Date()): boolean =>
  !assignment.completed && calcDaysLeft(assignment.dueDate, today) < 0;

export const calcStats = (assignments: Assignment[], today = new Date()) => {
  const bySubject: Record<string, number> = {};
  assignments.forEach((assignment) => { bySubject[assignment.subject] = (bySubject[assignment.subject] || 0) + 1; });
  return {
    total: assignments.length,
    completed: assignments.filter((assignment) => assignment.completed).length,
    overdue: assignments.filter((assignment) => isOverdue(assignment, today)).length,
    bySubject,
  };
};
