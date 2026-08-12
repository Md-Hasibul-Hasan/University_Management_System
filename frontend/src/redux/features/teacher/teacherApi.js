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


  }),
});

export const {
  useInviteTeacherMutation,
} = teacherApi;


