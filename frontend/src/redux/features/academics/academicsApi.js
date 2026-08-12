import { baseApi } from "../../baseApi";

export const academicsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
        
		getFaculties: builder.query({
			query: ({ search = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/faculties/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getFaculty: builder.query({
			query: (id) => ({
				url: `api/faculties/${id}/`,
				method: "GET",
			}),
		}),

		createFaculty: builder.mutation({
			query: (body) => ({
				url: "api/faculties/",
				method: "POST",
				body,
			}),
		}),

		updateFaculty: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/faculties/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteFaculty: builder.mutation({
			query: (id) => ({
				url: `api/faculties/${id}/`,
				method: "DELETE",
			}),
		}),

		getDepartments: builder.query({
			query: ({ search = "", ordering = "-created_at", page = 1, records = 5 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/departments/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getDepartment: builder.query({
			query: (id) => ({
				url: `api/departments/${id}/`,
				method: "GET",
			}),
		}),

		createDepartment: builder.mutation({
			query: (body) => ({
				url: "api/departments/",
				method: "POST",
				body,
			}),
		}),

		updateDepartment: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/departments/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteDepartment: builder.mutation({
			query: (id) => ({
				url: `api/departments/${id}/`,
				method: "DELETE",
			}),
		}),

		getSessions: builder.query({
			query: ({ search = "", ordering = "-session_no", page = 1, records = 5 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/sessions/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getSession: builder.query({
			query: (id) => ({
				url: `api/sessions/${id}/`,
				method: "GET",
			}),
		}),

		createSession: builder.mutation({
			query: (body) => ({
				url: "api/sessions/",
				method: "POST",
				body,
			}),
		}),

		updateSession: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/sessions/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteSession: builder.mutation({
			query: (id) => ({
				url: `api/sessions/${id}/`,
				method: "DELETE",
			}),
		}),

		getYearSemesters: builder.query({
			query: ({ search = "", ordering = "year", page = 1, records = 5 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/year-semesters/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getYearSemester: builder.query({
			query: (id) => ({
				url: `api/year-semesters/${id}/`,
				method: "GET",
			}),
		}),

		createYearSemester: builder.mutation({
			query: (body) => ({
				url: "api/year-semesters/",
				method: "POST",
				body,
			}),
		}),

		updateYearSemester: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/year-semesters/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteYearSemester: builder.mutation({
			query: (id) => ({
				url: `api/year-semesters/${id}/`,
				method: "DELETE",
			}),
		}),

	}),
});

export const {
	useGetFacultiesQuery,
	useGetFacultyQuery,
	useCreateFacultyMutation,
	useUpdateFacultyMutation,
	useDeleteFacultyMutation,
	useGetDepartmentsQuery,
	useGetDepartmentQuery,
	useCreateDepartmentMutation,
	useUpdateDepartmentMutation,
	useDeleteDepartmentMutation,
	useGetSessionsQuery,
	useGetSessionQuery,
	useCreateSessionMutation,
	useUpdateSessionMutation,
	useDeleteSessionMutation,
	useGetYearSemestersQuery,
	useGetYearSemesterQuery,
	useCreateYearSemesterMutation,
	useUpdateYearSemesterMutation,
	useDeleteYearSemesterMutation,
} = academicsApi;
