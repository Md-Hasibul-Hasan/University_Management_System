import { baseApi } from "../../baseApi";

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    inviteTeacher: builder.mutation({
      query: (data) => ({
        url: "api/teacher/invitation/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Teacher"],
    }),

    teacherRegister: builder.mutation({
      query: ({ token, ...body }) => ({
        url: `api/teacher/register/${token}/`,
        method: "POST",
        body,
      }),
    }),

    getTeacherInvitation: builder.query({
      query: (token) => ({
        url: `api/teacher/invitation/${token}/`,
        method: "GET",
      }),
    }),

    getTeachers: builder.query({
      query: ({ search = "", department = "", ordering = "-created_at", page = 1, records = 10 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (department) params.set("department", department);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return {
          url: `api/teacher/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
    }),

    getTeacher: builder.query({
      query: (id) => ({
        url: `api/teacher/${id}/`,
        method: "GET",
      }),
    }),

    updateTeacher: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/teacher/${id}/`,
        method: "PUT",
        body,
      }),
    }),

    partialUpdateTeacher: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/teacher/${id}/`,
        method: "PATCH",
        body,
      }),
    }),

    deleteTeacher: builder.mutation({
      query: (id) => ({
        url: `api/teacher/${id}/`,
        method: "DELETE",
      }),
    }),


  }),
});

export const {
  useInviteTeacherMutation,
  useTeacherRegisterMutation,
  useGetTeacherInvitationQuery,
  useGetTeachersQuery,
  useGetTeacherQuery,
  useUpdateTeacherMutation,
  usePartialUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = teacherApi;


