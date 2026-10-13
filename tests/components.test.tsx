import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Modal, message } from 'antd';
import { AssignmentCard, AssignmentForm } from '@/pages/TrangChu';
import reducer from '@/features/assignments/slice';
import { usePinStore } from '@/features/assignments/pinStore';
import type { Assignment } from '@/features/assignments/types';

const item: Assignment = { id: 'a', title: 'Bài React', subject: 'Web', dueDate: '2099-12-20', priority: 'high', completed: false };
const actions = () => ({ onToggle: jest.fn(), onRemove: jest.fn(), onPin: jest.fn(), onEdit: jest.fn() });
beforeEach(() => usePinStore.setState({ pinnedIds: [] }));
afterEach(() => { cleanup(); Modal.destroyAll(); message.destroy(); });

test('AssignmentCard displays title, subject, priority and due date', () => {
  render(<AssignmentCard assignment={item} {...actions()} />);
  expect(screen.getByRole('heading', { name: 'Bài React' })).toBeInTheDocument();
  expect(screen.getByText('Web')).toBeInTheDocument();
  expect(screen.getByText('Cao')).toBeInTheDocument();
  expect(screen.getByText(/Hạn nộp:/)).toHaveTextContent('2099');
});
test('complete button requires confirmation then passes correct id', async () => {
  const user = userEvent.setup();
  const handlers = actions();
  render(<AssignmentCard assignment={item} {...handlers} />);
  await user.click(screen.getByRole('button', { name: 'Hoàn thành' }));
  expect(handlers.onToggle).not.toHaveBeenCalled();
  await user.click(await screen.findByRole('button', { name: 'Xác nhận' }));
  await waitFor(() => expect(handlers.onToggle).toHaveBeenCalledWith('a'));
  expect(handlers.onToggle).toHaveBeenCalledTimes(1);
});
test('cancel completion leaves assignment unchanged', async () => {
  const user = userEvent.setup();
  const handlers = actions();
  render(<AssignmentCard assignment={item} {...handlers} />);
  await user.click(screen.getByRole('button', { name: 'Hoàn thành' }));
  await user.click(await screen.findByRole('button', { name: 'Hủy' }));
  expect(handlers.onToggle).not.toHaveBeenCalled();
});
test('pin button toggles real Zustand state and accessible label', async () => {
  const user = userEvent.setup();
  render(<AssignmentCard assignment={item} {...actions()} onPin={usePinStore.getState().togglePin} />);
  await user.click(screen.getByRole('button', { name: 'Ghim bài tập' }));
  expect(usePinStore.getState().isPinned('a')).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Bỏ ghim bài tập' }));
  expect(usePinStore.getState().isPinned('a')).toBe(false);
});
test('add form validates required fields without dispatching or closing', async () => {
  const user = userEvent.setup();
  const store = configureStore({ reducer: { assignments: reducer } });
  const close = jest.fn();
  render(<Provider store={store}><AssignmentForm onClose={close} /></Provider>);
  await user.click(screen.getByRole('button', { name: /Thêm bài tập/ }));
  expect(await screen.findByText('Nhập môn học')).toBeInTheDocument();
  expect(await screen.findByText('Nhập tên bài tập')).toBeInTheDocument();
  expect(await screen.findByText('Chọn hạn nộp')).toBeInTheDocument();
  expect(store.getState().assignments.items).toEqual([]);
  expect(close).not.toHaveBeenCalled();
});
test('valid add form submits data to Redux and closes', async () => {
  const user = userEvent.setup();
  const store = configureStore({ reducer: { assignments: reducer } });
  const close = jest.fn();
  render(<Provider store={store}><AssignmentForm onClose={close} /></Provider>);
  await user.type(screen.getByLabelText('Môn học'), 'TypeScript');
  await user.type(screen.getByLabelText('Tên bài tập'), 'Generic');
  // Native date input is not a text box in jsdom; set its ISO value explicitly.
  fireEvent.change(screen.getByLabelText('Hạn nộp'), { target: { value: '2026-12-01' } });
  await user.click(screen.getByRole('button', { name: /Thêm bài tập/ }));
  await waitFor(() => expect(store.getState().assignments.items).toHaveLength(1));
  expect(store.getState().assignments.items[0]).toMatchObject({ subject: 'TypeScript', title: 'Generic', dueDate: '2026-12-01', priority: 'medium', completed: false });
  expect(close).toHaveBeenCalledTimes(1);
});
