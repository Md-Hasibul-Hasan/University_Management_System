import { baseApi } from "../../baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "api/login/",
        method: "POST",
        body: credentials,
      }),
    }),
    
    getProfile: builder.query({
      query: () => ({
        url: "api/profile/",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),


  }),
});

export const { useLoginMutation, useGetProfileQuery, useLazyGetProfileQuery } = authApi;


