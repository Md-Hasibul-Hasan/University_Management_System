import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/redux/baseApi";
import authReducer from "./features/auth/authSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
    },

    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};
