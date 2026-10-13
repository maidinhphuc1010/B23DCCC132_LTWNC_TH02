import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { createLogger } from 'redux-logger';
import assignmentsReducer from './slice';

const logger = createLogger({ collapsed: true });
export const store = configureStore({
  reducer: { assignments: assignmentsReducer },
  middleware: (getDefaultMiddleware) => process.env.NODE_ENV === 'development'
    ? getDefaultMiddleware().concat(logger as any)
    : getDefaultMiddleware(),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
