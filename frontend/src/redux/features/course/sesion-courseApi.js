import { baseApi } from "../../baseApi";

export const sessionCourseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionCourses: builder.query({
      query: ({ search = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return {
          url: `api/session-course/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    getSessionCourse: builder.query({
      query: (id) => ({
        url: `api/session-course/${id}/`,
        method: "GET",
      }),
    }),

    createSessionCourse: builder.mutation({
      query: (body) => ({
        url: "api/session-course/",
        method: "POST",
        body,
      }),
    }),

    updateSessionCourse: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/session-course/${id}/`,
        method: "PUT",
        body,
      }),
    }),

    partialUpdateSessionCourse: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/session-course/${id}/`,
        method: "PATCH",
        body,
      }),
    }),

    deleteSessionCourse: builder.mutation({
      query: (id) => ({
        url: `api/session-course/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetSessionCoursesQuery,
  useGetSessionCourseQuery,
  useCreateSessionCourseMutation,
  useUpdateSessionCourseMutation,
  usePartialUpdateSessionCourseMutation,
  useDeleteSessionCourseMutation,
} = sessionCourseApi;