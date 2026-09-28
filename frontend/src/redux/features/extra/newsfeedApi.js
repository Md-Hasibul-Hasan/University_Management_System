import { baseApi } from "../../baseApi";

export const newsfeedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------
    // NEWSFEED LIST
    // ----------------------------------------------------------
    getNewsfeed: builder.query({
      query: ({ search = "", ordering = "-created_at", user = "", limit = 10, offset = 0 } = {}) => {
        const params = new URLSearchParams();

        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (user) params.set("user", String(user));
        if (limit) params.set("limit", limit);
        if (offset) params.set("offset", offset);

        const query = params.toString();

        return {
          url: `api/newsfeed/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Newsfeed"],
    }),

    getNewsfeedPost: builder.query({
      query: (id) => ({
        url: `api/newsfeed/${id}/`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Newsfeed", id: `POST-${id}` }],
    }),

    // ----------------------------------------------------------
    // CREATE / UPDATE / DELETE POST
    // ----------------------------------------------------------
    createNewsfeed: builder.mutation({
      // body: FormData with "content" and multiple "media" files
      query: (formData) => ({
        url: "api/newsfeed/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Newsfeed", "Notification"],
    }),

    updateNewsfeed: builder.mutation({
      // body: FormData with "content", repeated "media" files and "remove_media" ids
      query: ({ id, formData }) => ({
        url: `api/newsfeed/${id}/`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Newsfeed"],
    }),

    deleteNewsfeed: builder.mutation({
      query: (id) => ({
        url: `api/newsfeed/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Newsfeed"],
    }),

    // ----------------------------------------------------------
    // LIKE (toggle)
    // ----------------------------------------------------------
    toggleLike: builder.mutation({
      query: (id) => ({
        url: `api/newsfeed/${id}/like/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Newsfeed",
        "Notification",
        { type: "Newsfeed", id: `POST-${id}` },
      ],
    }),

    // ----------------------------------------------------------
    // COMMENTS (list / add / edit / delete)
    // ----------------------------------------------------------
    getComments: builder.query({
      query: ({ postId, limit = 10, offset = 0 } = {}) => {
        const params = new URLSearchParams();
        if (limit) params.set("limit", limit);
        if (offset) params.set("offset", offset);

        const query = params.toString();

        return {
          url: `api/newsfeed/${postId}/comment/${query ? `?${query}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, arg) => [
        { type: "Newsfeed", id: `COMMENTS-${arg.postId}` },
      ],
    }),

    addComment: builder.mutation({
      // reply_to: optional comment id when replying to a comment
      query: ({ postId, content, reply_to }) => ({
        url: `api/newsfeed/${postId}/comment/`,
        method: "POST",
        body: { content, ...(reply_to ? { reply_to } : {}) },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Newsfeed", id: `COMMENTS-${arg.postId}` },
        "Newsfeed",
        "Notification",
      ],
    }),

    // Comment owner can edit their own comment.
    editComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `api/newsfeed/comments/${commentId}/`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: ["Newsfeed"],
    }),

    // Comment owner OR post owner can delete a comment.
    deleteComment: builder.mutation({
      query: ({ commentId, postId }) => ({
        url: `api/newsfeed/comments/${commentId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Newsfeed", id: `COMMENTS-${arg.postId}` },
        "Newsfeed",
      ],
    }),

    // ----------------------------------------------------------
    // SHARE
    // ----------------------------------------------------------
    sharePost: builder.mutation({
      query: ({ id, content = "" }) => ({
        url: `api/newsfeed/${id}/share/`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Newsfeed"],
    }),
  }),
});

export const {
  useGetNewsfeedQuery,
  useLazyGetNewsfeedQuery,
  useGetNewsfeedPostQuery,
  useLazyGetNewsfeedPostQuery,
  useCreateNewsfeedMutation,
  useUpdateNewsfeedMutation,
  useDeleteNewsfeedMutation,
  useToggleLikeMutation,
  useGetCommentsQuery,
  useLazyGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
  useSharePostMutation,
} = newsfeedApi;
