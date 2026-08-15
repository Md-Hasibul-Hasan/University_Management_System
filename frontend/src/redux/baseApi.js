import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REFRESH_URL = "api/refresh-token/"; // Backend
const LOGIN_URL = "/login"; //Frontend

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

const setAccessToken = (token) =>
  localStorage.setItem(ACCESS_TOKEN_KEY, token);

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const redirectToLogin = () => {
  window.location.replace(LOGIN_URL);
};

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  prepareHeaders: (headers) => {
    const token = getAccessToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    redirectToLogin();
    return result;
  }

  const refreshResult = await baseQuery(
    {
      url: REFRESH_URL,
      method: "POST",
      body: { refresh: refreshToken },
    },
    api,
    extraOptions
  );

  if (refreshResult.data) {
    setAccessToken(refreshResult.data?.data?.access);
    return await baseQuery(args, api, extraOptions);
  }

  clearTokens();
  redirectToLogin();

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [ "Auth", "Student", "Teacher", "Course"],
  // Always fetch fresh data when a page loads or any query argument changes,
  // instead of serving cached (stale) values. This prevents outdated data
  // showing until a manual refresh, across all pages.
  refetchOnMountOrArgChange: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});