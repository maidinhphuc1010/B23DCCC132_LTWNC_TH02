import type { Assignment } from './types';
import { generateSampleAssignments } from './generator';

const sampleAssignments: Assignment[] = [
  { id: '1', subject: 'TypeScript', title: 'Xây dựng generic repository', dueDate: '2026-09-25', priority: 'high', completed: false },
  { id: '2', subject: 'React', title: 'Custom hook quản lý form', dueDate: '2026-09-20', priority: 'medium', completed: false },
  { id: '3', subject: 'Redux Toolkit', title: 'Feature slice với createAsyncThunk', dueDate: '2026-09-30', priority: 'high', completed: true },
  { id: '4', subject: 'UI/UX', title: 'Thiết kế wireframe ứng dụng', dueDate: '2026-10-04', priority: 'low', completed: false },
];

export const fetchAssignmentsApi = async (): Promise<Assignment[]> => {
  await new Promise((resolve) => setTimeout(resolve, 650));
  // Explicit, reload-safe fixture for baseline measurements only.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('benchmark') === '10000') {
    return generateSampleAssignments(10000);
  }
  return sampleAssignments.map((assignment) => ({ ...assignment }));
};
