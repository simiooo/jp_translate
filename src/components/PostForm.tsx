import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaImage, FaSmile, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useSocialActions } from '~/store/social';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PostFormProps {
  onSubmit?: (content: string, contentType?: string, visibility?: string, parentPostId?: number, imageUrls?: string[]) => void;
  parentPost?: {
    id: number;
    user: {
      username: string;
    };
    content: string;
  }; // For quote posts
}

const PostForm: React.FC<PostFormProps> = ({
  onSubmit,
  parentPost
}) => {
  const { t } = useTranslation();
  const { createPost } = useSocialActions();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [contentType, setContentType] = useState('text');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleSubmit = async () => {
    try {
      if (content.trim()) {
        if (onSubmit) {
          onSubmit(content, contentType, visibility, parentPost?.id, imageUrls);
        } else {
          await createPost(content, contentType, visibility, parentPost?.id, imageUrls);
        }
        
        // Reset form
        setContent('');
        setImageUrls([]);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const handleImageUpload = () => {
    // TODO: Implement image upload functionality
    console.log('Image upload clicked');
  };

  return (
    <Card className="border-0 rounded-none border-b">
      <CardContent className="p-3 md:p-4">
        <div className="flex gap-3">
          {/* User avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm md:text-lg">U</span>
          </div>

          {/* Form content */}
          <div className="flex-1 space-y-3">
            {/* Content type and visibility controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('Text')}</SelectItem>
                  <SelectItem value="image">{t('Image')}</SelectItem>
                  {parentPost && <SelectItem value="quote">{t('Quote')}</SelectItem>}
                </SelectContent>
              </Select>
              
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('Public')}</SelectItem>
                  <SelectItem value="followers">{t('Followers')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quote post indicator */}
            {parentPost && (
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground mb-2">{t('Quoting')}:</p>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {parentPost.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{parentPost.user?.username}</p>
                    <p className="text-sm text-foreground">{parentPost.content?.substring(0, 100)}...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Post content text area */}
            <Textarea
              placeholder={parentPost ? t('Add a comment...') : t("What's on your mind?")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none text-sm md:text-base"
              maxLength={280}
            />

            {/* Image preview */}
            {imageUrls.length > 0 && (
              <div className={`grid gap-2 ${
                imageUrls.length === 1 ? 'grid-cols-1' :
                imageUrls.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 sm:grid-cols-3'
              }`}>
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 text-xs"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={handleImageUpload}
                >
                  <FaImage className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <FaSmile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <FaMapMarkerAlt className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                {/* Character count */}
                <span className={`text-xs ${content.length > 260 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {content.length}/280
                </span>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <FaPaperPlane className="w-4 h-4 mr-2 hidden sm:inline" />
                  {parentPost ? t('Reply') : t('Publish')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostForm;