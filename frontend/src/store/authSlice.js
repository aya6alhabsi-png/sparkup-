import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password, role, phone, birthday }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/userRegister`, {
        name,
        email,
        password,
        role,     
        phone,
        birthday,
      });

      if (!res.data || !res.data.user) {
        return rejectWithValue(res.data?.msg || "Registration failed");
      }

      return res.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.msg || "Unable to register. Try again."
      );
    }
  }
);


export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/userLogin`, {
        email,
        password,
        role, 
      });

    
      if (!res.data.loginStatus) {
        return rejectWithValue(res.data.serverMsg || "Invalid credentials");
      }

     
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      return res.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.serverMsg || "Login failed"
      );
    }
  }
);


export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/resetPassword`, {
        email,
        newPassword,
      });

      if (!res.data.success) {
        return rejectWithValue(res.data.msg || "Password reset failed");
      }

      return res.data;
    } catch (err) {
      return rejectWithValue("Unable to reset password");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    // register
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // reset pass
    builder
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
