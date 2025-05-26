import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

const initialState = {
  attendanceRecords: [],
  currentRecord: null,
  isLoading: false,
  clockInStatus: {
    isClockedIn: false,
    isClockedOut: false,
    lastClockIn: null,
    isLoading: false,
    todayAttendance: null
  },
  error: null,
};

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const isAdmin = auth.user?.role === 'admin';
      
      const { data } = await api.get(
        isAdmin 
          ? `/attendance?startDate=${startDate}&endDate=${endDate}`
          : `/attendance/my-attendance?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      
      // Return the complete response for employee view to include todayStatus
      return isAdmin ? { attendances: data } : data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }
);

export const fetchClockInStatus = createAsyncThunk(
  'attendance/fetchClockInStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance/status');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clock-in status');
    }
  }
);

export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-in');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clock in');
    }
  }
);

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-out');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clock out');
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
      // Fetch attendance records cases
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload.attendances;
        
        // Update clock-in status if todayStatus is available (employee view)
        if (action.payload.todayStatus) {
          state.clockInStatus = {
            ...state.clockInStatus,
            isClockedIn: action.payload.todayStatus.isClockedIn,
            isClockedOut: action.payload.todayStatus.isClockedOut,
            todayAttendance: action.payload.todayStatus.attendance
          };
        }
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Clock-in status cases
      .addCase(fetchClockInStatus.pending, (state) => {
        state.clockInStatus.isLoading = true;
      })
      .addCase(fetchClockInStatus.fulfilled, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.clockInStatus.isClockedIn = action.payload.isClockedIn;
        state.clockInStatus.lastClockIn = action.payload.lastClockIn;
      })
      .addCase(fetchClockInStatus.rejected, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.error = action.payload;
      })
      // Clock-in cases
      .addCase(clockIn.pending, (state) => {
        state.clockInStatus.isLoading = true;
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.clockInStatus.isClockedIn = true;
        state.clockInStatus.isClockedOut = false;
        state.clockInStatus.todayAttendance = action.payload;
      })
      .addCase(clockIn.rejected, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.error = action.payload;
      })
      // Clock-out cases
      .addCase(clockOut.pending, (state) => {
        state.clockInStatus.isLoading = true;
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.clockInStatus.isClockedIn = true;
        state.clockInStatus.isClockedOut = true;
        state.clockInStatus.todayAttendance = action.payload;
      })
      .addCase(clockOut.rejected, (state, action) => {
        state.clockInStatus.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer; 