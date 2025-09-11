// Social Media Types based on API documentation

export interface UserResponse {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface PostCreateRequest {
  content: string; // max: 280
  content_type: 'text' | 'image' | 'quote';
  visibility: 'public' | 'followers';
  parent_post_id?: number;
  image_urls?: string[]; // max: 4
}

export interface PostUpdateRequest {
  content?: string; // max: 280
  visibility?: 'public' | 'followers';
}

export interface PostResponse {
  id: number;
  user: UserResponse;
  content: string;
  content_type: string;
  visibility: string;
  parent_post_id?: number;
  parent_post?: PostResponse;
  image_urls: string[];
  like_count: number;
  comment_count: number;
  repost_count: number;
  is_liked: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface CommentCreateRequest {
  content: string; // max: 280
  parent_comment_id?: number;
}

export interface CommentResponse {
  id: number;
  user: UserResponse;
  post_id: number;
  parent_comment_id?: number;
  content: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  replies: CommentResponse[];
}

export interface LikeResponse {
  id: number;
  user: UserResponse;
  post_id: number;
  created_at: string; // ISO 8601
}

export interface RepostResponse {
  id: number;
  user: UserResponse;
  original_post: PostResponse;
  quote_content?: string;
  created_at: string; // ISO 8601
}

export interface RelationshipResponse {
  id: number;
  follower: UserResponse;
  following: UserResponse;
  created_at: string; // ISO 8601
}

export interface FollowingStatusResponse {
  is_following: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FeedResponse {
  posts: PostResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TrendingResponse {
  posts: PostResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  time_range: string;
}

export interface SearchResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TrendingSearchesResponse {
  trending: string[];
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: string[];
}

export interface RecommendedUsersResponse {
  users: UserResponse[];
}

export interface RecommendedPostsResponse {
  posts: PostResponse[];
  total: number;
}

export interface HashtagResponse {
  id: number;
  name: string;
  usage_count: number;
}

export interface TrendingHashtagResponse {
  hashtag: HashtagResponse;
  post_count: number;
  total_engagement: number;
  last_used_at: string; // ISO 8601
}

export interface TrendingHashtagsResponse {
  trends: TrendingHashtagResponse[];
  time_range: string;
  limit: number;
}

// Error codes from API documentation
export enum SocialErrorCode {
  ErrCodeUserNotAuthenticated = 1001,
  ErrCodeInvalidRequestBody = 1002,
  ErrCodeValidationFailed = 1003,
  ErrCodePostNotFound = 1004,
  ErrCodePostNotVisible = 1005,
  ErrCodePostNotOwned = 1006,
  ErrCodePostNotEditable = 1007,
  ErrCodeCommentNotFound = 1008,
  ErrCodeUserNotFound = 1009,
  ErrCodeAlreadyFollowing = 1010,
  ErrCodeNotFollowing = 1011,
  ErrCodeUserNotFollowable = 1012,
  ErrCodeInvalidParameter = 1013,
  ErrCodeDatabaseQuery = 1014,
  ErrCodeRecordCreationFailed = 1015,
  ErrCodeRecordUpdateFailed = 1016,
  ErrCodeRecordDeleteFailed = 1017,
  ErrCodeDatabaseTransaction = 1018,
  ErrCodeExternalServiceError = 1019,
  ErrCodeInternalServerError = 1020,
}

// WebSocket event types
export interface WebSocketEvent {
  type: 'new_post' | 'new_like' | 'new_comment' | 'new_repost' | 'new_follower';
  data: {
    post?: PostResponse;
    like?: LikeResponse;
    comment?: CommentResponse;
    repost?: RepostResponse;
    relationship?: RelationshipResponse;
  };
  timestamp: string;
}

// Vocabulary-specific extensions for social features
export interface VocabularyPost extends PostResponse {
  vocabulary_data?: {
    word: string;
    meaning: string;
    kana?: string;
    lemma?: string;
    inflection?: string;
    pos?: string[];
  };
}

export interface VocabularyToken {
  word: string;
  pos: string[];
  meaning: string | null;
  kana: string | null;
  lemma: string | null;
  inflection: string | null;
  position?: {
    start: number;
    end: number;
  };
}