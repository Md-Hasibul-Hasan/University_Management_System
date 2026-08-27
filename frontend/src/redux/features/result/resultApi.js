import { baseApi } from "../../baseApi";

export const resultApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* Logged-in student's published semester result (semester GPA + status
       and each course's letter grade / grade point) for a year_semester. */
    getMySemesterResult: builder.query({
      query: ({ yearSemester, session } = {}) => {
        const params = new URLSearchParams();

        if (yearSemester) params.set("year_semester", yearSemester);
        if (session) params.set("session", session);

        const query = params.toString();

        return {
          url: `api/results/my-semester/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    /* Logged-in student's computed CGPA (credit-weighted over completed
       courses; retakes count once with their best grade point). */
    getMyCgpa: builder.query({
      query: () => ({
        url: "api/results/my-cgpa/",
        method: "GET",
      }),
    }),

    /* Per-student results (total marks / letter grade / grade point) for a
       session course — used by the teacher's marks page summary. */
    getSessionCourseResults: builder.query({
      query: (sessionCourseId) => ({
        url: `api/results/session-course/${sessionCourseId}/`,
        method: "GET",
      }),
    }),

    /* Department chairman: list all publishable semester results (combinations
       of session + year_semester whose courses are all published). */
    getPublishableSemesterResults: builder.query({
      query: () => ({
        url: "api/results/department-semester/publishable/",
        method: "GET",
      }),
    }),

    /* Department chairman: check whether all course results are published
       for a given session + year_semester. */
    getDepartmentSemesterStatus: builder.mutation({
      query: (body) => ({
        url: "api/results/department-semester/status/",
        method: "POST",
        body,
      }),
    }),

    /* Department chairman: calculate semester results without publishing. */
    calculateDepartmentSemesterResults: builder.mutation({
      query: (body) => ({
        url: "api/results/department-semester/calculate/",
        method: "POST",
        body,
      }),
    }),

    /* Department chairman: calculate & publish the department's semester results. */
    publishDepartmentSemesterResults: builder.mutation({
      query: (body) => ({
        url: "api/results/department-semester/publish/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMySemesterResultQuery,
  useGetMyCgpaQuery,
  useGetSessionCourseResultsQuery,
  useGetPublishableSemesterResultsQuery,
  useGetDepartmentSemesterStatusMutation,
  useCalculateDepartmentSemesterResultsMutation,
  usePublishDepartmentSemesterResultsMutation,
} = resultApi;
