import { baseApi } from "../../baseApi";

export const complainboxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------
    // COMPLAINT LIST (backend scopes visibility per user)
    // ----------------------------------------------------------
    getComplaints: builder.query({
      query: ({ search = "", ordering = "-created_at", complain_to = "", user = "", limit = 10, offset = 0 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (complain_to) params.set("complain_to", complain_to);
        if (user) params.set("user", String(user));
        if (limit) params.set("limit", limit);
        if (offset) params.set("offset", offset);

        const query = params.toString();

        return {
          url: `api/complainbox/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["ComplainBox"],
    }),

    getComplaint: builder.query({
      query: (id) => ({
        url: `api/complainbox/${id}/`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ComplainBox", id: `DETAIL-${id}` }],
    }),

    // ----------------------------------------------------------
    // CREATE / UPDATE / DELETE
    // ----------------------------------------------------------
    createComplaint: builder.mutation({
      // body: FormData with "title", "message", "complain_to" and multiple "media" files
      query: (formData) => ({
        url: "api/complainbox/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ComplainBox", "Notification"],
    }),

    updateComplaint: builder.mutation({
      // body: FormData with fields, repeated "media" files and "remove_media" ids
      query: ({ id, formData }) => ({
        url: `api/complainbox/${id}/`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["ComplainBox"],
    }),

    deleteComplaint: builder.mutation({
      query: (id) => ({
        url: `api/complainbox/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ComplainBox"],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useLazyGetComplaintsQuery,
  useGetComplaintQuery,
  useLazyGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useDeleteComplaintMutation,
} = complainboxApi;
