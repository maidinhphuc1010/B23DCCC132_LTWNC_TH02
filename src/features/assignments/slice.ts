import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchAssignmentsApi } from './api';
import type { Assignment, NewAssignment } from './types';

interface AssignmentsState {
  items: Assignment[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: AssignmentsState = { items: [], status: 'idle' };

export const fetchAssignments = createAsyncThunk('assignments/fetchAll', fetchAssignmentsApi);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    addAssignment: (state, action: PayloadAction<NewAssignment>) => {
      state.items.unshift({ ...action.payload, id: `${Date.now()}`, completed: false });
    },
    updateAssignment: (state, action: PayloadAction<{ id: string; changes: NewAssignment }>) => {
      const assignment = state.items.find((item) => item.id === action.payload.id);
      if (assignment) Object.assign(assignment, action.payload.changes);
    },
    toggleAssignment: (state, action: PayloadAction<string>) => {
      const assignment = state.items.find((item) => item.id === action.payload);
      if (assignment) assignment.completed = !assignment.completed;
    },
    removeAssignment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => { state.status = 'loading'; state.error = undefined; })
      .addCase(fetchAssignments.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchAssignments.rejected, (state) => { state.status = 'failed'; state.error = 'Không thể tải danh sách bài tập.'; });
  },
});

export const { addAssignment, updateAssignment, toggleAssignment, removeAssignment } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
