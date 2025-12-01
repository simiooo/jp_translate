import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaImage, FaSmile, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useSocialActions } from '~/store/social';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleSubmit = async () => {
    try {
      if (content.trim()) {
        if (onSubmit) {
          onSubmit(content, 'text', visibility, parentPost?.id, imageUrls);
        } else {
          await createPost(content, 'text', visibility, parentPost?.id, imageUrls);
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
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* User avatar */}
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">U</span>
          </div>

          {/* Form content */}
          <div className="flex-1 space-y-3">
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

            {/* Image preview */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input group with textarea and controls */}
            <InputGroup>
              <InputGroupTextarea
                placeholder={parentPost ? t('Add a comment...') : t("What's on your mind?")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[80px] resize-none"
                maxLength={280}
              />
              <InputGroupAddon align="block-end">
                {/* Visibility dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton variant="ghost" size="sm">
                      {visibility === 'public' ? t('Public') : t('Followers')}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem onClick={() => setVisibility('public')}>
                      {t('Public')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibility('followers')}>
                      {t('Followers')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Image upload button */}
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleImageUpload}
                >
                  <FaImage className="w-4 h-4" />
                </InputGroupButton>

                {/* Emoji button */}
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                >
                  <FaSmile className="w-4 h-4" />
                </InputGroupButton>

                {/* Location button */}
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                >
                  <FaMapMarkerAlt className="w-4 h-4" />
                </InputGroupButton>

                {/* Character count */}
                <InputGroupText className="ml-auto text-xs">
                  <span className={content.length > 260 ? 'text-red-500' : 'text-muted-foreground'}>
                    {content.length}/280
                  </span>
                </InputGroupText>

                <Separator orientation="vertical" className="!h-4" />

                {/* Send button */}
                <InputGroupButton
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  variant="default"
                  size="icon-xs"
                  className="rounded-full"
                >
                  <FaPaperPlane className="w-4 h-4" />
                  <span className="sr-only">{parentPost ? t('Reply') : t('Publish')}</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostForm;