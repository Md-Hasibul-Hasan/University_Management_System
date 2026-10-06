import { baseApi } from "../../baseApi";

export const reminderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------
    // LIST (backend scopes reminders to the logged-in user)
    // ----------------------------------------------------------
    getReminders: builder.query({
      query: ({ date = "", is_done = "", ordering = "date,created_at" } = {}) => {
        const params = new URLSearchParams();

        if (date) params.set("date", date);
        if (is_done !== "") params.set("is_done", String(is_done));
        if (ordering) params.set("ordering", ordering);

        const query = params.toString();

        return {
          url: `api/reminders/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Reminder"],
    }),

    // ----------------------------------------------------------
    // CREATE / UPDATE / DELETE
    // ----------------------------------------------------------
    createReminder: builder.mutation({
      // body: { date, time, title }
      query: (body) => ({
        url: "api/reminders/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reminder"],
    }),

    updateReminder: builder.mutation({
      // body: { id, ...fields }  (partial update)
      query: ({ id, ...body }) => ({
        url: `api/reminders/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Reminder"],
    }),

    deleteReminder: builder.mutation({
      query: (id) => ({
        url: `api/reminders/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reminder"],
    }),
  }),
});

export const {
  useGetRemindersQuery,
  useLazyGetRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useDeleteReminderMutation,
} = reminderApi;
