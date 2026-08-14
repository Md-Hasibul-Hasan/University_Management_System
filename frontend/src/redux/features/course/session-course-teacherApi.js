import { baseApi } from "../../baseApi";

export const sessionCourseTeacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionCourseTeachers: builder.query({
      query: ({ search = "", teacher = "", session = "", course = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (teacher) params.set("teacher", teacher);
        if (session) params.set("session_course__session", session);
        if (course) params.set("session_course__course", course);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return {
          url: `api/session-course-teacher/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    getSessionCourseTeacher: builder.query({
      query: (id) => ({
        url: `api/session-course-teacher/${id}/`,
        method: "GET",
      }),
    }),

    createSessionCourseTeacher: builder.mutation({
      query: (body) => ({
        url: "api/session-course-teacher/",
        method: "POST",
        body,
      }),
    }),

    updateSessionCourseTeacher: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/session-course-teacher/${id}/`,
        method: "PUT",
        body,
      }),
    }),

    partialUpdateSessionCourseTeacher: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/session-course-teacher/${id}/`,
        method: "PATCH",
        body,
      }),
    }),

    deleteSessionCourseTeacher: builder.mutation({
      query: (id) => ({
        url: `api/session-course-teacher/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetSessionCourseTeachersQuery,
  useGetSessionCourseTeacherQuery,
  useCreateSessionCourseTeacherMutation,
  useUpdateSessionCourseTeacherMutation,
  usePartialUpdateSessionCourseTeacherMutation,
  useDeleteSessionCourseTeacherMutation,
} = sessionCourseTeacherApi;