import { baseApi } from "../../baseApi";

export const studentApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		
		studentRegister: builder.mutation({
			query: (body) => ({
				url: "api/student/register/",
				method: "POST",
				body,
			}),
		}),

		verifyEmailLink: builder.mutation({
			query: ({ uid, token }) => ({
				url: `api/verify-email-link/${uid}/${token}/`,
				method: "POST",
			}),
		}),

		verifyEmailOtp: builder.mutation({
			query: (body) => ({
				url: "api/verify-email-otp/",
				method: "POST",
				body,
			}),
		}),

		resendVerificationEmail: builder.mutation({
			query: (body) => ({
				url: "api/resend-verification-email/",
				method: "POST",
				body,
			}),
		}),

		getStudents: builder.query({
			query: ({ search = "", department = "", approval_status = "", ordering = "-created_at", page = 1, records = 10 } = {}) => {
				const params = new URLSearchParams();

				if (search) params.set("search", search);
				if (department) params.set("department", department);
				if (approval_status) params.set("approval_status", approval_status);
				if (ordering) params.set("ordering", ordering);
				if (page) params.set("page", page);
				if (records) params.set("records", records);

				const query = params.toString();

				return {
					url: `api/student/${query ? `?${query}` : ""}`,
					method: "GET",
				};
			},
		}),

		getStudent: builder.query({
			query: (id) => ({
				url: `api/student/${id}/`,
				method: "GET",
			}),
		}),

		updateStudent: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/student/${id}/`,
				method: "PUT",
				body,
			}),
		}),

		partialUpdateStudent: builder.mutation({
			query: ({ id, ...body }) => ({
				url: `api/student/${id}/`,
				method: "PATCH",
				body,
			}),
		}),

		deleteStudent: builder.mutation({
			query: (id) => ({
				url: `api/student/${id}/`,
				method: "DELETE",
			}),
		}),

		generateStudentId: builder.mutation({
			query: (id) => ({
				url: `api/student/${id}/generate-student-id/`,
				method: "POST",
			}),
		}),

		approveStudent: builder.mutation({
			query: (id) => ({
				url: `api/student/${id}/approve/`,
				method: "POST",
			}),
		}),

		rejectStudent: builder.mutation({
			query: (id) => ({
				url: `api/student/${id}/reject/`,
				method: "POST",
			}),
		}),
	}),
});

export const {
	useStudentRegisterMutation,
	useVerifyEmailLinkMutation,
	useVerifyEmailOtpMutation,
	useResendVerificationEmailMutation,
	useGetStudentsQuery,
	useGetStudentQuery,
	useUpdateStudentMutation,
	usePartialUpdateStudentMutation,
	useDeleteStudentMutation,
	useGenerateStudentIdMutation,
	useApproveStudentMutation,
	useRejectStudentMutation,
} = studentApi;