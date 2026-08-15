import { baseApi } from "../../baseApi";

export const courseContentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCourseMaterials: builder.query({
      query: ({ session_course = "", search = "", ordering = "-uploaded_at", page = 1, records = 10 } = {}) => {
        const params = new URLSearchParams();
        if (session_course) params.set("session_course", session_course);
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);
        const query = params.toString();
        return { url: `api/course-material/${query ? `?${query}` : ""}`, method: "GET" };
      },
    }),
    getCourseMaterial: builder.query({
      query: (id) => ({ url: `api/course-material/${id}/`, method: "GET" }),
    }),
    createCourseMaterial: builder.mutation({
      query: (body) => ({ url: "api/course-material/", method: "POST", body }),
    }),
    updateCourseMaterial: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-material/${id}/`, method: "PUT", body }),
    }),
    partialUpdateCourseMaterial: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-material/${id}/`, method: "PATCH", body }),
    }),
    deleteCourseMaterial: builder.mutation({
      query: (id) => ({ url: `api/course-material/${id}/`, method: "DELETE" }),
    }),



    // =========================== Announcement ===========================


    getCourseAnnouncements: builder.query({
      query: ({ session_course = "", search = "", ordering = "-created_at", page = 1, records = 10 } = {}) => {
        const params = new URLSearchParams();

        if (session_course) params.set("session_course", session_course);
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return { url: `api/course-announcement/${query ? `?${query}` : ""}`, method: "GET" };
      },
    }),
    getCourseAnnouncement: builder.query({
      query: (id) => ({ url: `api/course-announcement/${id}/`, method: "GET" }),
    }),
    createCourseAnnouncement: builder.mutation({
      query: (body) => ({ url: "api/course-announcement/", method: "POST", body }),
    }),
    updateCourseAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-announcement/${id}/`, method: "PUT", body }),
    }),
    partialUpdateCourseAnnouncement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-announcement/${id}/`, method: "PATCH", body }),
    }),
    deleteCourseAnnouncement: builder.mutation({
      query: (id) => ({ url: `api/course-announcement/${id}/`, method: "DELETE" }),
    }),


    // =========================== Assignment ===========================

    getCourseAssignments: builder.query({
      query: ({ session_course = "", search = "", ordering = "-created_at", page = 1, records = 10 } = {}) => {
        const params = new URLSearchParams();

        if (session_course) params.set("session_course", session_course);
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return { url: `api/course-assignment/${query ? `?${query}` : ""}`, method: "GET" };
      },
    }),
    getCourseAssignment: builder.query({
      query: (id) => ({ url: `api/course-assignment/${id}/`, method: "GET" }),
    }),
    createCourseAssignment: builder.mutation({
      query: (body) => ({ url: "api/course-assignment/", method: "POST", body }),
    }),
    updateCourseAssignment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-assignment/${id}/`, method: "PUT", body }),
    }),
    partialUpdateCourseAssignment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-assignment/${id}/`, method: "PATCH", body }),
    }),
    deleteCourseAssignment: builder.mutation({
      query: (id) => ({ url: `api/course-assignment/${id}/`, method: "DELETE" }),
    }),


    // ====================== Assignment Submissions =======================

    getCourseAssignmentSubmissions: builder.query({
      query: ({ assignment = "", student = "", search = "", ordering = "-submitted_at", page = 1, records = 10 } = {}) => {
        const params = new URLSearchParams();

        if (assignment) params.set("assignment", assignment);
        if (student) params.set("student", student);
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (page) params.set("page", page);
        if (records) params.set("records", records);

        const query = params.toString();

        return { url: `api/course-assignment-submission/${query ? `?${query}` : ""}`, method: "GET" };
      },
    }),
    getCourseAssignmentSubmission: builder.query({
      query: (id) => ({ url: `api/course-assignment-submission/${id}/`, method: "GET" }),
    }),
    createCourseAssignmentSubmission: builder.mutation({
      query: (body) => ({ url: "api/course-assignment-submission/", method: "POST", body }),
    }),
    updateCourseAssignmentSubmission: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-assignment-submission/${id}/`, method: "PUT", body }),
    }),
    partialUpdateCourseAssignmentSubmission: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/course-assignment-submission/${id}/`, method: "PATCH", body }),
    }),
    deleteCourseAssignmentSubmission: builder.mutation({
      query: (id) => ({ url: `api/course-assignment-submission/${id}/`, method: "DELETE" }),
    }),


    // ====================== Assessment Marks =======================


    getAssessmentMarks: builder.query({
      query: (assessmentId) => ({ url: `api/assessments/${assessmentId}/marks/`, method: "GET" }),
    }),
    createAssessmentMarks: builder.mutation({
      query: ({ assessmentId, ...body }) => ({ url: `api/assessments/${assessmentId}/marks/`, method: "POST", body }),
    }),


    // ====================== Session Course Attendances =======================

    getSessionCourseAttendances: builder.query({
      query: (sessionCourseId) => ({ url: `api/session-courses/${sessionCourseId}/attendance/`, method: "GET" }),
    }),
    createSessionCourseAttendance: builder.mutation({
      query: ({ sessionCourseId, ...body }) => ({ url: `api/session-courses/${sessionCourseId}/attendance/`, method: "POST", body }),
    }),

    getAttendanceSessionRecords: builder.query({
      query: (attendanceSessionId) => ({ url: `api/attendance-sessions/${attendanceSessionId}/records/`, method: "GET" }),
    }),
    createAttendanceSessionRecords: builder.mutation({
      query: ({ attendanceSessionId, ...body }) => ({ url: `api/attendance-sessions/${attendanceSessionId}/records/`, method: "POST", body }),
    }),
  }),
});

export const {
  /* Course Materials */
  useGetCourseMaterialsQuery,
  useGetCourseMaterialQuery,
  useCreateCourseMaterialMutation,
  useUpdateCourseMaterialMutation,
  usePartialUpdateCourseMaterialMutation,
  useDeleteCourseMaterialMutation,

  /* Course Announcements */
  useGetCourseAnnouncementsQuery,
  useGetCourseAnnouncementQuery,
  useCreateCourseAnnouncementMutation,
  useUpdateCourseAnnouncementMutation,
  usePartialUpdateCourseAnnouncementMutation,
  useDeleteCourseAnnouncementMutation,

  /* Course Assignments */
  useGetCourseAssignmentsQuery,
  useGetCourseAssignmentQuery,
  useCreateCourseAssignmentMutation,
  useUpdateCourseAssignmentMutation,
  usePartialUpdateCourseAssignmentMutation,
  useDeleteCourseAssignmentMutation,

  /* Assignment Submissions */
  useGetCourseAssignmentSubmissionsQuery,
  useGetCourseAssignmentSubmissionQuery,
  useCreateCourseAssignmentSubmissionMutation,
  useUpdateCourseAssignmentSubmissionMutation,
  usePartialUpdateCourseAssignmentSubmissionMutation,
  useDeleteCourseAssignmentSubmissionMutation,

  /* Marks */
  useGetAssessmentMarksQuery,
  useCreateAssessmentMarksMutation,

  /* Attendance Sessions */
  useGetSessionCourseAttendancesQuery,
  useCreateSessionCourseAttendanceMutation,

  /* Attendance Records */
  useGetAttendanceSessionRecordsQuery,
  useCreateAttendanceSessionRecordsMutation,
} = courseContentApi;