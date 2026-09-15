import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/api.js';

// ===============================
// FETCH CURRENT USER
// ===============================
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/auth/me');

      return res.data.data.user;
    } catch (error) {
      console.error('FETCH CURRENT USER ERROR:', error);
      console.error('SERVER ERROR:', error.response?.data);
      console.error('STATUS:', error.response?.status);

      localStorage.removeItem('token');

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Session expired'
      );
    }
  }
);

// ===============================
// LOGIN USER
// ===============================
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload, thunkAPI) => {
    try {
      console.log('LOGIN PAYLOAD:', payload);

      const res = await api.post('/auth/login', payload);

      console.log('LOGIN RESPONSE:', res.data);

      localStorage.setItem('token', res.data.data.token);

      return res.data.data.user;
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      console.error('SERVER ERROR:', error.response?.data);
      console.error('STATUS:', error.response?.status);

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

// ===============================
// REGISTER USER
// ===============================
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, thunkAPI) => {
    try {
      console.log('==============================');
      console.log('REGISTER PAYLOAD:', payload);
      console.log('==============================');

      const res = await api.post('/auth/register', payload);

      console.log('==============================');
      console.log('REGISTER RESPONSE:', res.data);
      console.log('==============================');

      localStorage.setItem('token', res.data.data.token);

      return res.data.data.user;
    } catch (error) {
      console.error('==============================');
      console.error('REGISTER ERROR:', error);
      console.error('SERVER ERROR:', error.response?.data);
      console.error('STATUS:', error.response?.status);
      console.error('REQUEST URL:', error.config?.url);
      console.error('==============================');

      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Register failed'
      );
    }
  }
);

// ===============================
// LOGOUT USER
// ===============================
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    try {
      await api.post('/auth/logout');

      localStorage.removeItem('token');

      return true;
    } catch (error) {
      console.error('LOGOUT ERROR:', error);

      localStorage.removeItem('token');

      return true;
    }
  }
);

// ===============================
// INITIAL STATE
// ===============================
const initialState = {
  user: null,
  loading: false,
  error: null,
};

// ===============================
// AUTH SLICE
// ===============================
const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ===============================
      // FETCH CURRENT USER
      // ===============================
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })

      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.loading = false;
        state.error = action.payload;
      })

      // ===============================
      // LOGIN
      // ===============================
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===============================
      // REGISTER
      // ===============================
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===============================
      // LOGOUT
      // ===============================
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;
