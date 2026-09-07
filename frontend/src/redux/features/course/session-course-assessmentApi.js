import { baseApi } from "../../baseApi";

export const courseAssessmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseAssessments: builder.query({
      query: ({ search = "", session_course = "", "session_course__course__year_semester": yearSemester = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (session_course) params.set("session_course", session_course);
        if (yearSemester) params.set("session_course__course__year_semester", yearSemester);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return {
          url: `api/course-assessments/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    getCourseAssessment: builder.query({
      query: (id) => ({
        url: `api/course-assessments/${id}/`,
        method: "GET",
      }),
    }),

    createCourseAssessment: builder.mutation({
      query: (body) => ({
        url: "api/course-assessments/",
        method: "POST",
        body,
      }),
    }),

    updateCourseAssessment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/course-assessments/${id}/`,
        method: "PUT",
        body,
      }),
    }),

    partialUpdateCourseAssessment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/course-assessments/${id}/`,
        method: "PATCH",
        body,
      }),
    }),

    deleteCourseAssessment: builder.mutation({
      query: (id) => ({
        url: `api/course-assessments/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetCourseAssessmentsQuery,
  useGetCourseAssessmentQuery,
  useCreateCourseAssessmentMutation,
  useUpdateCourseAssessmentMutation,
  usePartialUpdateCourseAssessmentMutation,
  useDeleteCourseAssessmentMutation,
} = courseAssessmentApi;