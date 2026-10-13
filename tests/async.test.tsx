import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AssignmentList } from '@/pages/TrangChu';
import reducer from '@/features/assignments/slice';
import { fetchAssignmentsApi } from '@/features/assignments/api';
import type { Assignment } from '@/features/assignments/types';

jest.mock('@/features/assignments/api', () => ({ fetchAssignmentsApi: jest.fn() }));
const api = fetchAssignmentsApi as jest.MockedFunction<typeof fetchAssignmentsApi>;
const item: Assignment = { id: '1', title: 'API result', subject: 'Web', priority: 'low', completed: false, dueDate: '2099-01-01' };
const mount = () => {
  const store = configureStore({ reducer: { assignments: reducer } });
  render(<Provider store={store}><AssignmentList /></Provider>);
  return store;
};
beforeEach(() => api.mockReset());

test('AssignmentList shows loading until mocked API settles', async () => {
  let resolve!: (items: Assignment[]) => void;
  api.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const store = mount();
  expect(screen.getByText('Đang tải bài tập mẫu...')).toBeInTheDocument();
  expect(store.getState().assignments.status).toBe('loading');
  expect(screen.queryByText('API result')).not.toBeInTheDocument();
  await act(async () => { resolve([item]); });
  expect(await screen.findByText('API result')).toBeInTheDocument();
  expect(screen.queryByText('Đang tải bài tập mẫu...')).not.toBeInTheDocument();
});
test('AssignmentList renders successfully fetched assignments', async () => {
  api.mockResolvedValueOnce([item]);
  const store = mount();
  expect(await screen.findByRole('heading', { name: 'API result' })).toBeInTheDocument();
  expect(store.getState().assignments.items).toEqual([item]);
  expect(api).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Không thể tải danh sách bài tập.')).not.toBeInTheDocument();
});
test('AssignmentList displays API error and allows successful retry', async () => {
  api.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([item]);
  const store = mount();
  expect(await screen.findByText('Không thể tải danh sách bài tập.')).toBeInTheDocument();
  expect(store.getState().assignments.status).toBe('failed');
  await userEvent.setup().click(screen.getByRole('button', { name: /Tải lại/ }));
  expect(await screen.findByText('API result')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Không thể tải danh sách bài tập.')).not.toBeInTheDocument());
  expect(api).toHaveBeenCalledTimes(2);
});
