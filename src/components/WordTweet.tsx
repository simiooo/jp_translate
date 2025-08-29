import React from 'react';
import { Token } from '../types/jp_ast';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaEllipsisH
} from "react-icons/fa";

interface WordTweetProps {
  token: Token;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
}

const WordTweet: React.FC<WordTweetProps> = ({
  token,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
  likes = 0,
  comments = 0,
  shares = 0,
  views = 0
}) => {
  return (
    <Card className="border-0 rounded-none border-b hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        {/* Header with user info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-lg">
                {token.word}
              </h3>
              {token.kana && (
                <span className="text-muted-foreground text-sm">
                  @{token.kana}
                </span>
              )}
              <span className="text-muted-foreground text-sm">· 2h</span>
            </div>
            
            {/* Word content */}
            <div className="text-foreground mb-4">
              {token.meaning && (
                <p className="mb-2">
                  <span className="font-medium">含义: </span>
                  {token.meaning}
                </p>
              )}
              
              {token.lemma && token.lemma !== token.word && (
                <p className="mb-2">
                  <span className="font-medium">原型: </span>
                  {token.lemma}
                </p>
              )}
              
              {token.inflection && (
                <p className="mb-2">
                  <span className="font-medium">变形: </span>
                  {token.inflection}
                </p>
              )}
            </div>
            
            {/* Engagement metrics */}
            <div className="flex items-center justify-between text-muted-foreground text-sm mb-3">
              <span>{views} 浏览</span>
              <span>{comments} 回复</span>
              <span>{shares} 转发</span>
              <span>{likes} 喜欢</span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                onClick={onComment}
              >
                <FaComment className="w-4 h-4 mr-1" />
                回复
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-green-500 hover:bg-green-50"
                onClick={onShare}
              >
                <FaShare className="w-4 h-4 mr-1" />
                转发
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'} hover:bg-red-50`}
                onClick={onLike}
              >
                <FaHeart className="w-4 h-4 mr-1" />
                喜欢
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'} hover:bg-yellow-50`}
                onClick={onBookmark}
              >
                <FaBookmark className="w-4 h-4 mr-1" />
                收藏
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <FaEllipsisH className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordTweet;