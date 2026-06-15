import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import * as expenseApi from '../api/expenses';
import * as categoryApi from '../api/categories';

const AppContext = createContext(null);

const initialState = {
  expenses: [],
  categories: [],
  stats: null,
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload, loading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e._id === action.payload._id ? action.payload : e
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e._id !== action.payload),
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c._id === action.payload._id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c._id !== action.payload),
      };
    default:
      return state;
  }
}

const STATS_TTL = 60_000; // 60 seconds

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Refs avoid re-renders while tracking fetch state
  const categoriesLoadedRef = useRef(false);
  const expensesDirtyRef = useRef(true); // true = needs a fetch
  const lastFetchParamsRef = useRef(null); // JSON key of last fetchExpenses params
  const statsCache = useRef({}); // { "month-year": { data, ts } }

  const fetchCategories = useCallback(async () => {
    if (categoriesLoadedRef.current) return;
    try {
      let data = await categoryApi.getCategories();
      if (data.length === 0) data = await categoryApi.seedCategories();
      categoriesLoadedRef.current = true;
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (err) {
      console.error('Failed to fetch categories:', err.message);
    }
  }, []);

  // Load categories once at startup so all screens have them immediately
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const fetchExpenses = useCallback(async (params, force = false) => {
    const key = JSON.stringify(params);
    const sameParams = lastFetchParamsRef.current === key;
    // Skip if same params, not dirty, and not forced
    if (!force && sameParams && !expensesDirtyRef.current && lastFetchParamsRef.current !== null) return;

    expensesDirtyRef.current = false;
    lastFetchParamsRef.current = key;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await expenseApi.getExpenses(params);
      dispatch({ type: 'SET_EXPENSES', payload: data?.expenses ?? [] });
    } catch (err) {
      expensesDirtyRef.current = true; // allow retry next focus
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const fetchStats = useCallback(async (params) => {
    const key = `${params.month}-${params.year}`;
    const cached = statsCache.current[key];
    if (cached && Date.now() - cached.ts < STATS_TTL) {
      dispatch({ type: 'SET_STATS', payload: cached.data });
      return;
    }
    try {
      const data = await expenseApi.getExpenseStats(params);
      statsCache.current[key] = { data, ts: Date.now() };
      dispatch({ type: 'SET_STATS', payload: data });
    } catch (err) {
      console.error('Failed to fetch stats:', err.message);
    }
  }, []);

  // Call after any mutation so next focus re-fetches
  const markDirty = useCallback(() => {
    expensesDirtyRef.current = true;
    statsCache.current = {};
  }, []);

  // Call after bulk-deleting categories so next fetchCategories re-fetches from server
  const resetCategories = useCallback(() => {
    categoriesLoadedRef.current = false;
    dispatch({ type: 'SET_CATEGORIES', payload: [] });
  }, []);

  const addExpense = useCallback(async (data) => {
    const expense = await expenseApi.createExpense(data);
    dispatch({ type: 'ADD_EXPENSE', payload: expense });
    markDirty();
    return expense;
  }, [markDirty]);

  const editExpense = useCallback(async (id, data) => {
    const expense = await expenseApi.updateExpense(id, data);
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    markDirty();
    return expense;
  }, [markDirty]);

  const removeExpense = useCallback(async (id) => {
    await expenseApi.deleteExpense(id);
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    markDirty();
  }, [markDirty]);

  const addCategory = useCallback(async (data) => {
    const category = await categoryApi.createCategory(data);
    dispatch({ type: 'ADD_CATEGORY', payload: category });
    return category;
  }, []);

  const editCategory = useCallback(async (id, data) => {
    const category = await categoryApi.updateCategory(id, data);
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
    return category;
  }, []);

  const removeCategory = useCallback(async (id) => {
    await categoryApi.deleteCategory(id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        fetchExpenses,
        fetchCategories,
        fetchStats,
        markDirty,
        resetCategories,
        addExpense,
        editExpense,
        removeExpense,
        addCategory,
        editCategory,
        removeCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
