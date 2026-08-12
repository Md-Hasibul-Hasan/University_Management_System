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

    updateProfile: builder.mutation({
      query: (body) => ({
        url: "api/profile/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: "api/change-password/",
        method: "POST",
        body,
      }),
    }),

    changeEmail: builder.mutation({
      query: (body) => ({
        url: "api/change-email/",
        method: "POST",
        body,
      }),
    }),

    verifyChangeEmail: builder.mutation({
      query: (body) => ({
        url: "api/verify-change-email/",
        method: "POST",
        body,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "api/forgot-password/",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation({
      query: (body) => ({
        url: "api/reset-password/",
        method: "POST",
        body,
      }),
    }),


  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useVerifyChangeEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;


