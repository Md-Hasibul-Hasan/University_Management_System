import { baseApi } from "../../baseApi";

export const courseApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getCourses: builder.query({
			query: ({ search = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/course/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getCourse: builder.query({
			query: (id) => ({
				url: `api/course/${id}/`,
				method: "GET",
			}),
		}),

		createCourse: builder.mutation({
			query: (body) => ({
				url: "api/course/",
				method: "POST",
				body,
			}),
		}),

		updateCourse: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/course/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteCourse: builder.mutation({
			query: (id) => ({
				url: `api/course/${id}/`,
				method: "DELETE",
			}),
		}),
	}),
});

export const {
	useGetCoursesQuery,
	useGetCourseQuery,
	useCreateCourseMutation,
	useUpdateCourseMutation,
	useDeleteCourseMutation,
} = courseApi;