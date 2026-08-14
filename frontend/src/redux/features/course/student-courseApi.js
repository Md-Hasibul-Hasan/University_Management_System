import { baseApi } from "../../baseApi";

export const studentCourseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudentCourses: builder.query({
      query: ({ search = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
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


