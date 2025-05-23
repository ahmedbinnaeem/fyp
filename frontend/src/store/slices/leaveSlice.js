import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  leaves: [],
  currentLeave: null,
  isLoading: false,
  error: null,
};

export const fetchLeaves = createAsyncThunk(
  'leaves/fetchLeaves',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.get('http://localhost:5000/api/leaves', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

export const createLeave = createAsyncThunk(
  'leaves/createLeave',
  async (leaveData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.post('http://localhost:5000/api/leaves', leaveData, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave request');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leaves/updateLeaveStatus',
  async ({ leaveId, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.put(
        `http://localhost:5000/api/leaves/${leaveId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave status');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    setCurrentLeave: (state, action) => {
      state.currentLeave = action.payload;
    },
    clearLeaveError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leaves
      .addCase(fetchLeaves.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create leave
      .addCase(createLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaves.push(action.payload);
      })
      .addCase(createLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update leave status
      .addCase(updateLeaveStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.leaves.findIndex(
          (leave) => leave._id === action.payload._id
        );
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentLeave, clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer; 