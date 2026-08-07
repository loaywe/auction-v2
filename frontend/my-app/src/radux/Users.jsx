import { createSlice } from "@reduxjs/toolkit";

const defaultUser = {
  username: "",
  userType: "visitor",
  imageId: "",
  email: "",
  phone: "",
  address: "",
  walletBalance: 0,
  age: 20,
  gender: "",
};

let initialUser = { ...defaultUser };
let initialToken = "";

try {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");
  if (storedUser) {
    initialUser = JSON.parse(storedUser);
  }
  if (storedToken) {
    initialToken = storedToken;
  }
} catch {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

const userSlice = createSlice({
  name: "users",
  initialState: {
    user: initialUser,
    token: initialToken,
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    updateToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
    },

    clearUser: (state) => {
      state.user = { ...defaultUser };
      state.token = "";
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { updateUser, updateToken, clearUser } = userSlice.actions;
export default userSlice.reducer;