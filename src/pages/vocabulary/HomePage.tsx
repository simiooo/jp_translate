import React, { useState, useRef, useCallback } from "react";
import { useRequest } from "ahooks";
import { alovaInstance } from "~/utils/request";
import { PostResponse, UserResponse } from "~/types/social";
import Spinner from "~/components/Spinner";
import { VList, VListHandle } from "virtua";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import { useTranslation } from 'react-i18next'
import { useNavigate } from "react-router";

// Store
import { useSocialStore } from "~/store/social";

// Components
import Post from "~/components/Post";
import UserCard from "~/components/UserCard";
import SocialRightSidebar from "~/components/SocialRightSidebar";

// Shadcn/ui imports
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const VocabularyHomePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const listContainerRef = useRef<VListHandle>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"posts" | "users">("posts");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [vlistKey] = useState(0);
  const fetchedCountRef = useRef(-1);
  
  // Social store for batch like operations
  const { addToLikeQueue, updatePostInList } = useSocialStore();

  // Use ahooks useRequest for searching posts
  const {
    run: searchPosts,
    loading: postsLoading
  } = useRequest(
    async (query: string, page: number = 1, limit: number = 10) => {
      const response = await alovaInstance.Get<{
        items: PostResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
        };
      }>('/api/social/search/posts', {
        params: { q: query, page, limit }
      });
      
      setPosts(response.items);
      return response;
    },
    {
      manual: true,
      onError: (error) => {
        console.error("Failed to search posts:", error);
      }
    }
  );

  // Use ahooks useRequest for searching users
  const {
    run: searchUsers,
    loading: usersLoading
  } = useRequest(
    async (query: string, page: number = 1, limit: number = 10) => {
      const response = await alovaInstance.Get<{
        users: UserResponse[];
        pagination: {
          total: number;
          page: number;
          limit: number;
        };
      }>('/api/social/search/users', {
        params: { q: query, page, limit }
      });
      
      setUsers(response.users);
      return response;
    },
    {
      manual: true,
      onError: (error) => {
        console.error("Failed to search users:", error);
      }
    }
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      if (searchType === "posts") {
        searchPosts(query, 1, 10);
      } else {
        searchUsers(query, 1, 10);
      }
    } else {
      setPosts([]);
      setUsers([]);
    }
  };

  // Handle search type change
  const handleSearchTypeChange = (type: "posts" | "users") => {
    setSearchType(type);
    if (searchQuery.trim()) {
      if (type === "posts") {
        searchPosts(searchQuery, 1, 10);
      } else {
        searchUsers(searchQuery, 1, 10);
      }
    }
  };

  const handleScroll = useCallback(async () => {
    if (!listContainerRef.current) return;
    
    const items = searchType === "posts" ? posts : users;
    const count = items.length;
    
    if (fetchedCountRef.current < count &&
        listContainerRef.current.findEndIndex() + 50 > count) {
      fetchedCountRef.current = count;
      const nextPage = Math.floor(count / 10) + 1;
      
      if (searchQuery.trim()) {
        if (searchType === "posts") {
          await searchPosts(searchQuery, nextPage, 10);
        } else {
          await searchUsers(searchQuery, nextPage, 10);
        }
      }
    }
  }, [posts, users, searchQuery, searchType, searchPosts, searchUsers]);


  // Handle post like/unlike with optimistic updates and batch processing
  const handlePostLike = (postId: number, isLiked: boolean) => {
    // Find the post in the current posts
    const post = posts.find(p => p.id === postId);
    if (post) {
      // Optimistic update - immediately update UI
      updatePostInList(postId, {
        is_liked: isLiked,
        like_count: isLiked ? post.like_count + 1 : Math.max(0, post.like_count - 1)
      });

      // Add to batch queue
      addToLikeQueue(postId, isLiked ? 'like' : 'unlike');
    }
  };

  const handlePostComment = (post: { id: number }) => {
    console.log("Comment on post:", post);
    // TODO: Implement comment modal or navigation
  };

  const handlePostShare = (post: { id: number }) => {
    console.log("Share post:", post);
    // TODO: Implement share functionality
  };

  const handlePostBookmark = (post: { id: number }) => {
    console.log("Bookmark post:", post);
    // TODO: Implement bookmark functionality
  };

  const handlePostRepost = async (post: { id: number }) => {
    try {
      await alovaInstance.Post(`/api/social/posts/${post.id}/repost`);
      // Refresh search results to show the new repost
      if (searchQuery.trim() && searchType === "posts") {
        searchPosts(searchQuery, 1, 10);
      }
    } catch (error) {
      console.error("Failed to repost:", error);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await alovaInstance.Post(`/api/social/users/${userId}/follow`);
      // Refresh user search results to update follow status
      if (searchQuery.trim() && searchType === "users") {
        searchUsers(searchQuery, 1, 10);
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await alovaInstance.Delete(`/api/social/users/${userId}/follow`);
      // Refresh user search results to update follow status
      if (searchQuery.trim() && searchType === "users") {
        searchUsers(searchQuery, 1, 10);
      }
    } catch (error) {
      console.error("Failed to unfollow user:", error);
    }
  };

  const handleUserClick = (user: UserResponse) => {
    navigate(`/profile/${user.id}`);
  };

  const handleFollowUserSidebar = (userId: string) => {
    console.log("Follow user from sidebar:", userId);
    // TODO: Implement follow functionality from sidebar
  };

  const handleTrendClick = (hashtag: string) => {
    console.log("Hashtag clicked:", hashtag);
    // Navigate to trends page with the hashtag pre-selected
    window.location.href = `/social/trends?hashtag=${encodeURIComponent(hashtag)}`;
  };

  const retryLoad = () => {
    if (searchQuery.trim()) {
      if (searchType === "posts") {
        searchPosts(searchQuery, 1, 10);
      } else {
        searchUsers(searchQuery, 1, 10);
      }
    } else {
      setPosts([]);
      setUsers([]);
    }
  };

  const isLoading = searchType === "posts" ? postsLoading : usersLoading;
  const items = searchType === "posts" ? posts : users;

  return (
    <div className="h-[calc(100vh-60px)] overflow-y-auto bg-background">
      <div className="flex h-full">

        {/* Main Content */}
        <div className="flex-1 min-w-0 border-x">
          {/* Header with search */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">{t("Vocabulary Search")}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={searchType === "posts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSearchTypeChange("posts")}
                  >
                    {t("Posts")}
                  </Button>
                  <Button
                    variant={searchType === "users" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSearchTypeChange("users")}
                  >
                    {t("Users")}
                  </Button>
                </div>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchType === "posts" ? t("Search posts...") : t("Search users...")}
                    className="w-80 pl-10"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search results */}
          <div className="min-h-[calc(100vh-140px)]">
            {searchQuery.trim() ? (
              <>
                {isLoading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="p-4 border-b">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          {searchType === "users" && <Skeleton className="h-8 w-20" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  // Empty search state
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                      <Search className="w-full h-full" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {searchType === "posts" ? t("No posts found") : t("No users found")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("Try searching for something else")}
                    </p>
                    <Button onClick={retryLoad}>
                      {t("Refresh")}
                    </Button>
                  </div>
                ) : (
                  // Results list
                  <>
                    {searchType === "posts" ? (
                      // Posts list with VList
                      <VList
                        ref={listContainerRef}
                        data={posts}
                        itemSize={160}
                        onScroll={handleScroll}
                        key={`vlist-${vlistKey}`}
                      >
                        {(post,index) => {
                          if (!post) return <></>;
                          return (
                            <Post
                              key={`${post.id}-${index}`}
                              post={post}
                              onComment={() => handlePostComment(post)}
                              onShare={() => handlePostShare(post)}
                              onBookmark={() => handlePostBookmark(post)}
                              onRepost={() => handlePostRepost(post)}
                              onLike={handlePostLike}
                              isLiked={post.is_liked}
                            />
                          );
                        }}
                      </VList>
                    ) : (
                      // Users list
                      <div className="divide-y">
                        {users.map((user) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            onFollow={() => handleFollowUser(user.id.toString())}
                            onUnfollow={() => handleUnfollowUser(user.id.toString())}
                            onClick={() => handleUserClick(user)}
                          />
                        ))}
                      </div>
                    )}
                    {isLoading && items.length > 0 && (
                      <div className="p-4 flex justify-center">
                        <Spinner loading={true} />
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              // Empty state when no search query
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {t("Search for vocabulary content")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("Search for posts or users related to Japanese vocabulary learning")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <SocialRightSidebar
          onFollow={handleFollowUserSidebar}
          onTrendClick={handleTrendClick}
        />
      </div>
    </div>
  );
};

export default VocabularyHomePage;
export const HydrateFallback = HydrateFallbackTemplate;