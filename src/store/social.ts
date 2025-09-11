import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  PostResponse,
  CommentResponse,
  RepostResponse,
  RelationshipResponse,
  UserResponse,
  FeedResponse,
  TrendingResponse,
  SearchResponse,
  TrendingSearchesResponse,
  SearchSuggestionsResponse,
  RecommendedUsersResponse,
  RecommendedPostsResponse
} from '~/types/social'
import { alovaInstance } from '~/utils/request'
import { useShallow } from 'zustand/shallow'

interface SocialState {
  // Posts
  posts: PostResponse[]
  currentPost: PostResponse | null
  postsLoading: boolean
  postsError: string | null
  
  // Comments
  comments: CommentResponse[]
  commentsLoading: boolean
  commentsError: string | null
  
  // User relationships
  followers: RelationshipResponse[]
  following: RelationshipResponse[]
  followersLoading: boolean
  followingLoading: boolean
  followersError: string | null
  followingError: string | null
  
  // Feed and recommendations
  feed: PostResponse[]
  recommendedPosts: PostResponse[]
  trendingPosts: PostResponse[]
  feedLoading: boolean
  recommendedLoading: boolean
  trendingLoading: boolean
  feedError: string | null
  recommendedError: string | null
  trendingError: string | null
  
  // Search and trends
  trendingSearches: string[]
  searchSuggestions: string[]
  searchResults: PostResponse[]
  searchLoading: boolean
  searchError: string | null
  
  // Recommended users
  recommendedUsers: UserResponse[]
  recommendedUsersLoading: boolean
  recommendedUsersError: string | null
  
  // Pagination
  postsPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  feedPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // Batch operations
  likeQueue: Array<{
    postId: number
    action: 'like' | 'unlike'
    timestamp: number
  }>
  processingBatch: boolean
}

interface SocialActions {
  // Post actions
  createPost: (content: string, contentType?: string, visibility?: string, parentPostId?: number, imageUrls?: string[]) => Promise<void>
  updatePost: (postId: number, content?: string, visibility?: string) => Promise<void>
  deletePost: (postId: number) => Promise<void>
  getPost: (postId: number) => Promise<void>
  getUserPosts: (userId: number, page?: number, limit?: number) => Promise<void>
  
  // Interaction actions
  likePost: (postId: number) => Promise<void>
  unlikePost: (postId: number) => Promise<void>
  commentOnPost: (postId: number, content: string, parentCommentId?: number) => Promise<void>
  deleteComment: (commentId: number) => Promise<void>
  getPostComments: (postId: number, page?: number, limit?: number) => Promise<void>
  repostPost: (postId: number, quoteContent?: string) => Promise<void>
  
  // Relationship actions
  followUser: (userId: number) => Promise<void>
  unfollowUser: (userId: number) => Promise<void>
  getFollowers: (userId: number, page?: number, limit?: number) => Promise<void>
  getFollowing: (userId: number, page?: number, limit?: number) => Promise<void>
  checkFollowingStatus: (userId: number) => Promise<boolean>
  getRecommendedUsers: (limit?: number) => Promise<void>
  
  // Feed actions
  getFeed: (type?: 'following' | 'recommended' | 'trending' | 'combined', page?: number, limit?: number) => Promise<void>
  getFollowingFeed: (page?: number, limit?: number) => Promise<void>
  getRecommendedFeed: (page?: number, limit?: number) => Promise<void>
  getTrendingPosts: (page?: number, limit?: number, timeRange?: string) => Promise<void>
  
  // Search actions
  searchPosts: (query: string, page?: number, limit?: number) => Promise<void>
  searchUsers: (query: string, page?: number, limit?: number) => Promise<UserResponse[]>
  getTrendingSearches: (limit?: number) => Promise<void>
  getSearchSuggestions: (query: string, limit?: number) => Promise<void>
  
  // Recommendation actions
  getRecommendedPosts: (limit?: number) => Promise<void>
  
  // Utility actions
  clearErrors: () => void
  resetPosts: () => void
  resetFeed: () => void
  updatePostInList: (postId: number, updates: Partial<PostResponse>) => void
  
  // Batch operations
  processLikeQueue: () => Promise<void>
  addToLikeQueue: (postId: number, action: 'like' | 'unlike') => void
}

const initialState: SocialState = {
  posts: [],
  currentPost: null,
  postsLoading: false,
  postsError: null,
  
  comments: [],
  commentsLoading: false,
  commentsError: null,
  
  followers: [],
  following: [],
  followersLoading: false,
  followingLoading: false,
  followersError: null,
  followingError: null,
  
  feed: [],
  recommendedPosts: [],
  trendingPosts: [],
  feedLoading: false,
  recommendedLoading: false,
  trendingLoading: false,
  feedError: null,
  recommendedError: null,
  trendingError: null,
  
  trendingSearches: [],
  searchSuggestions: [],
  searchResults: [],
  searchLoading: false,
  searchError: null,
  
  recommendedUsers: [],
  recommendedUsersLoading: false,
  recommendedUsersError: null,
  
  postsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  feedPagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  
  // Batch operations
  likeQueue: [],
  processingBatch: false
}

export const useSocialStore = create<SocialState & SocialActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Post actions
      createPost: async (content: string, contentType = 'text', visibility = 'public', parentPostId?: number, imageUrls?: string[]) => {
        set({ postsLoading: true, postsError: null })
        try {
          const newPost = await alovaInstance.Post<{ post: PostResponse }>('/api/social/posts', {
            content,
            content_type: contentType,
            visibility,
            parent_post_id: parentPostId,
            image_urls: imageUrls
          })

          set(state => ({
            posts: [newPost.post, ...state.posts],
            postsLoading: false
          }))
        } catch (error) {
          set({ 
            postsLoading: false,
            postsError: error instanceof Error ? error.message : 'Failed to create post'
          })
          throw error
        }
      },

      updatePost: async (postId: number, content?: string, visibility?: string) => {
        set({ postsLoading: true, postsError: null })
        try {
          const updatedPost = await alovaInstance.Put<{ post: PostResponse }>(`/api/social/posts/${postId}`, {
            content,
            visibility
          })

          set(state => ({
            posts: state.posts.map(post => 
              post.id === postId ? updatedPost.post : post
            ),
            currentPost: state.currentPost?.id === postId ? updatedPost.post : state.currentPost,
            postsLoading: false
          }))
        } catch (error) {
          set({ 
            postsLoading: false,
            postsError: error instanceof Error ? error.message : 'Failed to update post'
          })
          throw error
        }
      },

      deletePost: async (postId: number) => {
        set({ postsLoading: true, postsError: null })
        try {
          await alovaInstance.Delete(`/api/social/posts/${postId}`)

          set(state => ({
            posts: state.posts.filter(post => post.id !== postId),
            currentPost: state.currentPost?.id === postId ? null : state.currentPost,
            postsLoading: false
          }))
        } catch (error) {
          set({ 
            postsLoading: false,
            postsError: error instanceof Error ? error.message : 'Failed to delete post'
          })
          throw error
        }
      },

      getPost: async (postId: number) => {
        set({ postsLoading: true, postsError: null })
        try {
          const response = await alovaInstance.Get<{ post: PostResponse }>(`/api/social/posts/${postId}`)

          set({
            currentPost: response.post,
            postsLoading: false
          })
        } catch (error) {
          set({ 
            postsLoading: false,
            postsError: error instanceof Error ? error.message : 'Failed to get post'
          })
          throw error
        }
      },

      getUserPosts: async (userId: number, page = 1, limit = 10) => {
        set({ postsLoading: true, postsError: null })
        try {
          const response = await alovaInstance.Get<{ posts: PostResponse[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
            `/api/social/posts/user/${userId}`,
            { params: { page, limit } }
          )

          set(state => ({
            posts: page === 1 ? response.posts : [...state.posts, ...response.posts],
            postsPagination: response.pagination,
            postsLoading: false
          }))
        } catch (error) {
          set({ 
            postsLoading: false,
            postsError: error instanceof Error ? error.message : 'Failed to get user posts'
          })
          throw error
        }
      },

      // Interaction actions
      likePost: async (postId: number) => {
        // Optimistic update
        set(state => ({
          posts: state.posts.map(post =>
            post.id === postId
              ? { ...post, is_liked: true, like_count: post.like_count + 1 }
              : post
          ),
          currentPost: state.currentPost?.id === postId
            ? { ...state.currentPost, is_liked: true, like_count: state.currentPost.like_count + 1 }
            : state.currentPost
        }))

        try {
          // Use batch API
          await alovaInstance.Post<{
            results: Array<{
              post_id: number;
              action: string;
              success: boolean;
              error?: string;
              like_id?: number;
            }>;
            total: number;
            success: number;
            failed: number;
          }>('/api/social/posts/batch/like', {
            actions: [{ post_id: postId, action: 'like' }]
          })
        } catch (error) {
          // Rollback on error
          set(state => ({
            posts: state.posts.map(post =>
              post.id === postId
                ? { ...post, is_liked: false, like_count: Math.max(0, post.like_count - 1) }
                : post
            ),
            currentPost: state.currentPost?.id === postId
              ? { ...state.currentPost, is_liked: false, like_count: Math.max(0, state.currentPost.like_count - 1) }
              : state.currentPost
          }))
          throw error
        }
      },

      unlikePost: async (postId: number) => {
        // Optimistic update
        set(state => ({
          posts: state.posts.map(post =>
            post.id === postId
              ? { ...post, is_liked: false, like_count: Math.max(0, post.like_count - 1) }
              : post
          ),
          currentPost: state.currentPost?.id === postId
            ? { ...state.currentPost, is_liked: false, like_count: Math.max(0, state.currentPost.like_count - 1) }
            : state.currentPost
        }))

        try {
          // Use batch API
          await alovaInstance.Post<{
            results: Array<{
              post_id: number;
              action: string;
              success: boolean;
              error?: string;
            }>;
            total: number;
            success: number;
            failed: number;
          }>('/api/social/posts/batch/like', {
            actions: [{ post_id: postId, action: 'unlike' }]
          })
        } catch (error) {
          // Rollback on error
          set(state => ({
            posts: state.posts.map(post =>
              post.id === postId
                ? { ...post, is_liked: true, like_count: post.like_count + 1 }
                : post
            ),
            currentPost: state.currentPost?.id === postId
              ? { ...state.currentPost, is_liked: true, like_count: state.currentPost.like_count + 1 }
              : state.currentPost
          }))
          throw error
        }
      },

      commentOnPost: async (postId: number, content: string, parentCommentId?: number) => {
        const response = await alovaInstance.Post<{ comment: CommentResponse }>(`/api/social/posts/${postId}/comment`, {
          content,
          parent_comment_id: parentCommentId
        })

        set(state => ({
          posts: state.posts.map(post => 
            post.id === postId 
              ? { ...post, comment_count: post.comment_count + 1 }
              : post
          ),
          currentPost: state.currentPost?.id === postId 
            ? { ...state.currentPost, comment_count: state.currentPost.comment_count + 1 }
            : state.currentPost,
          comments: parentCommentId 
            ? state.comments // Handle nested comments separately if needed
            : [...state.comments, response.comment]
        }))
      },

      deleteComment: async (commentId: number) => {
        await alovaInstance.Delete(`/api/social/comments/${commentId}`)

        set(state => ({
          comments: state.comments.filter(comment => comment.id !== commentId)
        }))
      },

      getPostComments: async (postId: number, page = 1, limit = 10) => {
        set({ commentsLoading: true, commentsError: null })
        try {
          const response = await alovaInstance.Get<{ comments: CommentResponse[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
            `/api/social/posts/${postId}/comments`,
            { params: { page, limit } }
          )

          set(state => ({
            comments: page === 1 ? response.comments : [...state.comments, ...response.comments],
            commentsLoading: false
          }))
        } catch (error) {
          set({ 
            commentsLoading: false,
            commentsError: error instanceof Error ? error.message : 'Failed to get comments'
          })
          throw error
        }
      },

      repostPost: async (postId: number, quoteContent?: string) => {
        const response = await alovaInstance.Post<{ repost: RepostResponse }>(`/api/social/posts/${postId}/repost`, {
          quote_content: quoteContent
        })

        set(state => ({
          posts: [{ ...response.repost, content_type: 'repost' } as unknown as PostResponse, ...state.posts] // Treat repost as post for feed
        }))
      },

      // Relationship actions
      followUser: async (userId: number) => {
        await alovaInstance.Post<{ relationship: RelationshipResponse }>(`/api/social/users/${userId}/follow`)

        // Update recommended users to remove followed user
        set(state => ({
          recommendedUsers: state.recommendedUsers.filter(user => user.id !== userId)
        }))
      },

      unfollowUser: async (userId: number) => {
        await alovaInstance.Delete(`/api/social/users/${userId}/follow`)

        // Update following list
        set(state => ({
          following: state.following.filter(rel => rel.following.id !== userId)
        }))
      },

      getFollowers: async (userId: number, page = 1, limit = 20) => {
        set({ followersLoading: true, followersError: null })
        try {
          const response = await alovaInstance.Get<{ followers: RelationshipResponse[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
            `/api/social/users/${userId}/followers`,
            { params: { page, limit } }
          )

          set(state => ({
            followers: page === 1 ? response.followers : [...state.followers, ...response.followers],
            followersLoading: false
          }))
        } catch (error) {
          set({ 
            followersLoading: false,
            followersError: error instanceof Error ? error.message : 'Failed to get followers'
          })
          throw error
        }
      },

      getFollowing: async (userId: number, page = 1, limit = 20) => {
        set({ followingLoading: true, followingError: null })
        try {
          const response = await alovaInstance.Get<{ following: RelationshipResponse[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
            `/api/social/users/${userId}/following`,
            { params: { page, limit } }
          )

          set(state => ({
            following: page === 1 ? response.following : [...state.following, ...response.following],
            followingLoading: false
          }))
        } catch (error) {
          set({ 
            followingLoading: false,
            followingError: error instanceof Error ? error.message : 'Failed to get following'
          })
          throw error
        }
      },

      checkFollowingStatus: async (userId: number) => {
        const response = await alovaInstance.Get<{ is_following: boolean }>(`/api/social/users/${userId}/following-status`)
        return response.is_following
      },

      getRecommendedUsers: async (limit = 10) => {
        set({ recommendedUsersLoading: true, recommendedUsersError: null })
        try {
          const response = await alovaInstance.Get<RecommendedUsersResponse>(
            '/api/social/recommendations/users',
            { params: { limit } }
          )

          set({
            recommendedUsers: response.users,
            recommendedUsersLoading: false
          })
        } catch (error) {
          set({ 
            recommendedUsersLoading: false,
            recommendedUsersError: error instanceof Error ? error.message : 'Failed to get recommended users'
          })
          throw error
        }
      },

      // Feed actions
      getFeed: async (type: 'following' | 'recommended' | 'trending' | 'combined' = 'following', page = 1, limit = 10) => {
        set({ feedLoading: true, feedError: null })
        try {
          const response = await alovaInstance.Get<FeedResponse>(
            '/api/social/feed',
            { params: { type, page, limit } }
          )

          set(state => ({
            feed: page === 1 ? response.posts : [...state.feed, ...response.posts],
            feedPagination: response.pagination,
            feedLoading: false
          }))
        } catch (error) {
          set({ 
            feedLoading: false,
            feedError: error instanceof Error ? error.message : 'Failed to get feed'
          })
          throw error
        }
      },

      getFollowingFeed: async (page = 1, limit = 10) => {
        return get().getFeed('following', page, limit)
      },

      getRecommendedFeed: async (page = 1, limit = 10) => {
        return get().getFeed('recommended', page, limit)
      },

      getTrendingPosts: async (page = 1, limit = 10, timeRange = '24h') => {
        set({ trendingLoading: true, trendingError: null })
        try {
          const response = await alovaInstance.Get<TrendingResponse>(
            '/api/social/feed/trending',
            { params: { page, limit, time_range: timeRange } }
          )

          set(state => ({
            trendingPosts: page === 1 ? response.posts : [...state.trendingPosts, ...response.posts],
            trendingLoading: false
          }))
        } catch (error) {
          set({ 
            trendingLoading: false,
            trendingError: error instanceof Error ? error.message : 'Failed to get trending posts'
          })
          throw error
        }
      },

      // Search actions
      searchPosts: async (query: string, page = 1, limit = 10) => {
        set({ searchLoading: true, searchError: null })
        try {
          const response = await alovaInstance.Get<SearchResponse<PostResponse>>(
            '/api/social/search/posts',
            { params: { q: query, page, limit } }
          )

          set(state => ({
            searchResults: page === 1 ? response.items : [...state.searchResults, ...response.items],
            searchLoading: false
          }))
        } catch (error) {
          set({ 
            searchLoading: false,
            searchError: error instanceof Error ? error.message : 'Failed to search posts'
          })
          throw error
        }
      },

      searchUsers: async (query: string, page = 1, limit = 10): Promise<UserResponse[]> => {
        set({ searchLoading: true, searchError: null })
        try {
          const response = await alovaInstance.Get<SearchResponse<UserResponse>>(
            '/api/social/search/users',
            { params: { q: query, page, limit } }
          )

          set({ searchLoading: false })
          return response.items
        } catch (error) {
          set({ 
            searchLoading: false,
            searchError: error instanceof Error ? error.message : 'Failed to search users'
          })
          throw error
        }
      },

      getTrendingSearches: async (limit = 10) => {
        const response = await alovaInstance.Get<TrendingSearchesResponse>(
          '/api/social/search/trending',
          { params: { limit } }
        )

        set({
          trendingSearches: response.trending
        })
      },

      getSearchSuggestions: async (query: string, limit = 5) => {
        const response = await alovaInstance.Get<SearchSuggestionsResponse>(
          '/api/social/search/suggestions',
          { params: { q: query, limit } }
        )

        set({
          searchSuggestions: response.suggestions
        })
      },

      // Recommendation actions
      getRecommendedPosts: async (limit = 10) => {
        set({ recommendedLoading: true, recommendedError: null })
        try {
          const response = await alovaInstance.Get<RecommendedPostsResponse>(
            '/api/social/recommendations/posts',
            { params: { limit } }
          )

          set({
            recommendedPosts: response.posts,
            recommendedLoading: false
          })
        } catch (error) {
          set({ 
            recommendedLoading: false,
            recommendedError: error instanceof Error ? error.message : 'Failed to get recommended posts'
          })
          throw error
        }
      },

      // Utility actions
      clearErrors: () => {
        set({
          postsError: null,
          commentsError: null,
          followersError: null,
          followingError: null,
          feedError: null,
          recommendedError: null,
          trendingError: null,
          searchError: null,
          recommendedUsersError: null
        })
      },

      resetPosts: () => {
        set({
          posts: [],
          postsPagination: initialState.postsPagination
        })
      },

      resetFeed: () => {
        set({
          feed: [],
          feedPagination: initialState.feedPagination
        })
      },

      updatePostInList: (postId: number, updates: Partial<PostResponse>) => {
        set(state => ({
          posts: state.posts.map(post =>
            post.id === postId ? { ...post, ...updates } : post
          ),
          currentPost: state.currentPost?.id === postId
            ? { ...state.currentPost, ...updates }
            : state.currentPost,
          feed: state.feed.map(post =>
            post.id === postId ? { ...post, ...updates } : post
          ),
          recommendedPosts: state.recommendedPosts.map(post =>
            post.id === postId ? { ...post, ...updates } : post
          ),
          trendingPosts: state.trendingPosts.map(post =>
            post.id === postId ? { ...post, ...updates } : post
          )
        }))
      },

      // Batch operations
      addToLikeQueue: (postId: number, action: 'like' | 'unlike') => {
        set(state => ({
          likeQueue: [...state.likeQueue, { postId, action, timestamp: Date.now() }]
        }))
        
        // Process queue if not already processing
        const { processingBatch } = get()
        if (!processingBatch) {
          get().processLikeQueue()
        }
      },

      processLikeQueue: async () => {
        set({ processingBatch: true })
        
        const { likeQueue } = get()
        if (likeQueue.length === 0) {
          set({ processingBatch: false })
          return
        }

        try {
          // Group actions by post to avoid duplicates
          const actionsMap = new Map<number, 'like' | 'unlike'>()
          likeQueue.forEach(item => {
            actionsMap.set(item.postId, item.action)
          })

          const actions = Array.from(actionsMap.entries()).map(([postId, action]) => ({
            post_id: postId,
            action
          }))

          const response = await alovaInstance.Post<{
            results: Array<{
              post_id: number;
              action: string;
              success: boolean;
              error?: string;
              like_id?: number;
            }>;
            total: number;
            success: number;
            failed: number;
          }>('/api/social/posts/batch/like', { actions })

          // Handle failed actions
          const failedActions = response.results.filter(result => !result.success)
          if (failedActions.length > 0) {
            console.error('Batch like operations failed:', failedActions)
            // TODO: Add error handling for failed batch operations
          }

          // Clear processed queue
          set(state => ({
            likeQueue: state.likeQueue.filter(item =>
              !actionsMap.has(item.postId)
            ),
            processingBatch: false
          }))

          // Process next batch if any
          if (get().likeQueue.length > 0) {
            get().processLikeQueue()
          }

        } catch (error) {
          console.error('Failed to process like queue:', error)
          set({ processingBatch: false })
        }
      }
    }),
    {
      name: 'social-storage',
      partialize: (state) => ({
        trendingSearches: state.trendingSearches,
        searchSuggestions: state.searchSuggestions
      })
    }
  )
)

// Helper hooks for easier access to social state
export const usePosts = () => useSocialStore((state) => state.posts)
export const useCurrentPost = () => useSocialStore((state) => state.currentPost)
export const usePostsLoading = () => useSocialStore((state) => state.postsLoading)
export const usePostsError = () => useSocialStore((state) => state.postsError)

export const useComments = () => useSocialStore((state) => state.comments)
export const useCommentsLoading = () => useSocialStore((state) => state.commentsLoading)
export const useCommentsError = () => useSocialStore((state) => state.commentsError)

export const useFollowers = () => useSocialStore((state) => state.followers)
export const useFollowing = () => useSocialStore((state) => state.following)
export const useFollowersLoading = () => useSocialStore((state) => state.followersLoading)
export const useFollowingLoading = () => useSocialStore((state) => state.followingLoading)

export const useFeed = () => useSocialStore((state) => state.feed)
export const useFeedLoading = () => useSocialStore((state) => state.feedLoading)
export const useFeedError = () => useSocialStore((state) => state.feedError)
export const useRecommendedPosts = () => useSocialStore((state) => state.recommendedPosts)
export const useTrendingPosts = () => useSocialStore((state) => state.trendingPosts)
export const useRecommendedLoading = () => useSocialStore((state) => state.recommendedLoading)
export const useTrendingLoading = () => useSocialStore((state) => state.trendingLoading)

export const useSocialActions = () => useSocialStore(useShallow((state) => ({
  createPost: state.createPost,
  updatePost: state.updatePost,
  deletePost: state.deletePost,
  getPost: state.getPost,
  getUserPosts: state.getUserPosts,
  likePost: state.likePost,
  unlikePost: state.unlikePost,
  commentOnPost: state.commentOnPost,
  deleteComment: state.deleteComment,
  getPostComments: state.getPostComments,
  repostPost: state.repostPost,
  followUser: state.followUser,
  unfollowUser: state.unfollowUser,
  getFollowers: state.getFollowers,
  getFollowing: state.getFollowing,
  checkFollowingStatus: state.checkFollowingStatus,
  getRecommendedUsers: state.getRecommendedUsers,
  getFeed: state.getFeed,
  getFollowingFeed: state.getFollowingFeed,
  getRecommendedFeed: state.getRecommendedFeed,
  getTrendingPosts: state.getTrendingPosts,
  searchPosts: state.searchPosts,
  searchUsers: state.searchUsers,
  getTrendingSearches: state.getTrendingSearches,
  getSearchSuggestions: state.getSearchSuggestions,
  getRecommendedPosts: state.getRecommendedPosts,
  clearErrors: state.clearErrors,
  resetPosts: state.resetPosts,
  resetFeed: state.resetFeed,
  updatePostInList: state.updatePostInList,
  processLikeQueue: state.processLikeQueue,
  addToLikeQueue: state.addToLikeQueue
})))