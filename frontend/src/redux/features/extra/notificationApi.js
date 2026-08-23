import { baseApi } from "../../baseApi";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ search = "", is_read = "", ordering = "-created_at", limit = 50, offset = 0 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (is_read !== "") params.set("is_read", String(is_read));
        if (ordering) params.set("ordering", ordering);
        if (limit) params.set("limit", limit);
        if (offset) params.set("offset", offset);

        const query = params.toString();

        return {
          url: `api/notifications/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Notification"],
    }),

    getNotification: builder.query({
      query: (id) => ({
        url: `api/notifications/${id}/`,
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `api/notifications/${id}/mark_read/`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "api/notifications/mark_all_read/",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `api/notifications/${id}/delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useLazyGetNotificationsQuery,
  useLazyGetNotificationQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
