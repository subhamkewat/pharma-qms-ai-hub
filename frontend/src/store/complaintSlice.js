import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = 'http://127.0.0.1:8000/api';

// Async Thunks
export const fetchStats = createAsyncThunk(
  'complaints/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`);
      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchComplaints = createAsyncThunk(
  'complaints/fetchComplaints',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`${API_BASE}/complaints/history?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch complaints history');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchComplaintById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${id}`);
      if (!response.ok) throw new Error('Complaint not found');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const analyzeComplaintText = createAsyncThunk(
  'complaints/analyzeComplaintText',
  async (description, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const analyzeComplaintFile = createAsyncThunk(
  'complaints/analyzeComplaintFile',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/complaints/upload-doc`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'File upload and analysis failed');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const submitComplaint = createAsyncThunk(
  'complaints/submitComplaint',
  async (complaintData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData),
      });
      if (!response.ok) throw new Error('Failed to log customer complaint');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateComplaint = createAsyncThunk(
  'complaints/updateComplaint',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update complaint details');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteComplaint = createAsyncThunk(
  'complaints/deleteComplaint',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete complaint');
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCopilotMessages = createAsyncThunk(
  'complaints/fetchCopilotMessages',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${id}/copilot`);
      if (!response.ok) throw new Error('Failed to load chat history');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendMessageToCopilot = createAsyncThunk(
  'complaints/sendMessageToCopilot',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      // Optimistic user message append in component, but backend returns the assistant message.
      const response = await fetch(`${API_BASE}/complaints/${id}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content }),
      });
      if (!response.ok) throw new Error('Failed to send message to Copilot');
      return await response.json(); // assistant response message
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Initial State
const initialState = {
  complaints: [],
  selectedComplaint: null,
  stats: {
    total_complaints: 0,
    critical_complaints: 0,
    avg_completeness_score: 0,
    status_counts: { New: 0, 'Under Investigation': 0, 'CAPA Initiated': 0, Closed: 0 },
    severity_counts: { Critical: 0, Major: 0, Minor: 0 },
    priority_counts: { High: 0, Medium: 0, Low: 0 },
    recent_activity: []
  },
  copilotMessages: [],
  analyzedComplaint: null,
  
  status: 'idle', // idle | loading | succeeded | failed
  analysisStatus: 'idle', // idle | loading | succeeded | failed
  copilotStatus: 'idle', // idle | loading | succeeded | failed
  error: null,
};

// Slice
const complaintSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    resetAnalyzedComplaint(state) {
      state.analyzedComplaint = null;
      state.analysisStatus = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
    addLocalCopilotMessage(state, action) {
      // Used to instantly push user message for smooth UI chat experience
      state.copilotMessages.push({
        id: Date.now(),
        role: action.payload.role,
        content: action.payload.content,
        timestamp: new Date().toISOString()
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchStats
      .addCase(fetchStats.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // fetchComplaints
      .addCase(fetchComplaints.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.complaints = action.payload;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // fetchComplaintById
      .addCase(fetchComplaintById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedComplaint = action.payload;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // analyzeComplaintText
      .addCase(analyzeComplaintText.pending, (state) => {
        state.analysisStatus = 'loading';
      })
      .addCase(analyzeComplaintText.fulfilled, (state, action) => {
        state.analysisStatus = 'succeeded';
        state.analyzedComplaint = action.payload;
      })
      .addCase(analyzeComplaintText.rejected, (state, action) => {
        state.analysisStatus = 'failed';
        state.error = action.payload;
      })
      
      // analyzeComplaintFile
      .addCase(analyzeComplaintFile.pending, (state) => {
        state.analysisStatus = 'loading';
      })
      .addCase(analyzeComplaintFile.fulfilled, (state, action) => {
        state.analysisStatus = 'succeeded';
        state.analyzedComplaint = action.payload;
      })
      .addCase(analyzeComplaintFile.rejected, (state, action) => {
        state.analysisStatus = 'failed';
        state.error = action.payload;
      })
      
      // submitComplaint
      .addCase(submitComplaint.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(submitComplaint.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.complaints.unshift(action.payload);
        state.analyzedComplaint = null; // Clear staging area
      })
      .addCase(submitComplaint.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // updateComplaint
      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.selectedComplaint = action.payload;
        // Update item inside historical list if it exists there
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
      })
      
      // deleteComplaint
      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.complaints = state.complaints.filter(c => c.id !== action.payload);
        if (state.selectedComplaint?.id === action.payload) {
          state.selectedComplaint = null;
        }
      })
      
      // fetchCopilotMessages
      .addCase(fetchCopilotMessages.fulfilled, (state, action) => {
        state.copilotMessages = action.payload;
      })
      
      // sendMessageToCopilot
      .addCase(sendMessageToCopilot.pending, (state) => {
        state.copilotStatus = 'loading';
      })
      .addCase(sendMessageToCopilot.fulfilled, (state, action) => {
        state.copilotStatus = 'succeeded';
        // Add the returned assistant message
        state.copilotMessages.push(action.payload);
      })
      .addCase(sendMessageToCopilot.rejected, (state, action) => {
        state.copilotStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { resetAnalyzedComplaint, clearError, addLocalCopilotMessage } = complaintSlice.actions;
export default complaintSlice.reducer;
