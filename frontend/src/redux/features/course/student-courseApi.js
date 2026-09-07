import { baseApi } from "../../baseApi";

export const studentCourseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudentCourses: builder.query({
      query: ({ search = "", "session_course__session": session = "", "session_course__course__department": department = "", "session_course__course__year_semester": yearSemester = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (session) params.set("session_course__session", session);
        if (department) params.set("session_course__course__department", department);
        if (yearSemester) params.set("session_course__course__year_semester", yearSemester);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return {
          url: `api/student-courses/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    getStudentCourse: builder.query({
      query: (id) => ({
        url: `api/student-courses/${id}/`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetStudentCoursesQuery,
  useGetStudentCourseQuery,
} = studentCourseApi;


