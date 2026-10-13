import type { Assignment, Priority } from './types';

const SUBJECTS = ['Toán cao cấp', 'Lập trình Web', 'Cơ sở dữ liệu', 'Tiếng Anh', 'Mạng máy tính'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export const generateSampleAssignments = (count = 10000): Assignment[] => {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + (index % 45) - 15);
    return {
      id: `stress-${index + 1}`,
      subject: SUBJECTS[index % SUBJECTS.length],
      title: `Bài tập mẫu số ${String(index + 1).padStart(5, '0')}`,
      dueDate: dueDate.toISOString().slice(0, 10),
      priority: PRIORITIES[index % PRIORITIES.length],
      completed: index % 7 === 0,
    };
  });
};
