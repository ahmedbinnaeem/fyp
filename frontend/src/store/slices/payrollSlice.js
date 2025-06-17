import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  payrolls: [],
  currentPayroll: null,
  isLoading: false,
  error: null,
};

export const fetchPayrolls = createAsyncThunk(
  'payroll/fetchPayrolls',
  async ({ month, year }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.get(
        `http://localhost:5000/api/payroll?month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payroll records');
    }
  }
);

export const generatePayroll = createAsyncThunk(
  'payroll/generatePayroll',
  async ({ month, year }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.post(
        'http://localhost:5000/api/payroll/generate',
        { month, year },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate payroll');
    }
  }
);

export const updatePayrollStatus = createAsyncThunk(
  'payroll/updatePayrollStatus',
  async ({ payrollId, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { data } = await axios.put(
        `http://localhost:5000/api/payroll/${payrollId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      // If the response contains a message about paid payroll, treat it as an error
      if (data.message && data.message.includes('already been paid')) {
        return rejectWithValue(data.message);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payroll status');
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setCurrentPayroll: (state, action) => {
      state.currentPayroll = action.payload;
    },
    clearPayrollError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch payrolls
      .addCase(fetchPayrolls.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrolls = action.payload;
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Generate payroll
      .addCase(generatePayroll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generatePayroll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrolls = state.payrolls.concat(action.payload);
      })
      .addCase(generatePayroll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update payroll status
      .addCase(updatePayrollStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePayrollStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.payrolls.findIndex(
          (payroll) => payroll._id === action.payload._id
        );
        if (index !== -1) {
          state.payrolls[index] = action.payload;
        }
      })
      .addCase(updatePayrollStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPayroll, clearPayrollError } = payrollSlice.actions;
export default payrollSlice.reducer; 