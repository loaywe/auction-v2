import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./Users";

const store = configureStore({
  reducer: {
    users: userReducer,
  },
});

export default store;