import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  attendanceRecords: [],
  currentRecord: null,
  isLoading: false,
  error: null,
};

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.get(
        `http://localhost:5000/api/attendance?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }
);

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (location, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.post(
        'http://localhost:5000/api/attendance/check-in',
        { location },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check in');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (location, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.post(
        'http://localhost:5000/api/attendance/check-out',
        { location },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check out');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check in
      .addCase(checkIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecord = action.payload;
        state.attendanceRecords.push(action.payload);
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check out
      .addCase(checkOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecord = action.payload;
        const index = state.attendanceRecords.findIndex(
          (record) => record._id === action.payload._id
        );
        if (index !== -1) {
          state.attendanceRecords[index] = action.payload;
        }
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer; 