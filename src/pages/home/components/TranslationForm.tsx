import { useRef, useCallback } from "react";
import { useKeyPress } from "ahooks";
import { MdAutoFixHigh, MdOutlineTranslate, MdVolumeUp, MdMoreVert } from "react-icons/md";
import { IoImageOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import TextHighlightMask from "~/components/TextHighlightMask";

import { useTranslationForm } from "../hooks/useTranslationForm";
import { FileUploadSection } from "./FileUploadSection";
import type { TranslationFormData } from "~/schemas/translation";
import type { UploadFileItem } from "~/hooks/useFileUpload";

interface TranslationFormProps {
  form: ReturnType<typeof useTranslationForm>["form"];
  highlightPosition: ReturnType<typeof useTranslationForm>["highlightPosition"];
  normanizeText: ReturnType<typeof useTranslationForm>["normanizeText"];
  onSubmit: (data: TranslationFormData) => Promise<void>;
  loading: boolean;
  ttsLoading: boolean;
  handleTTS: (text: string) => Promise<void>;
  fileList: UploadFileItem[];
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (uid: string) => void;
  retryUpload: (uid: string) => Promise<void>;
  fileUploadLoading: boolean;
}

export function TranslationForm({
  form,
  highlightPosition,
  normanizeText,
  onSubmit,
  loading,
  ttsLoading,
  handleTTS,
  fileList,
  addFiles,
  removeFile,
  retryUpload,
  fileUploadLoading,
}: TranslationFormProps) {
  const { t } = useTranslation();
  const uploadBtnRef = useRef<HTMLInputElement>(null);

  useKeyPress("alt.enter", () => {
    form.handleSubmit(onSubmit)();
  });

  useKeyPress("alt.q", () => {
    form.setFocus("text");
  });

  // 处理文件上传的方法，封装为独立方法方便调用
  const handleFileUpload = useCallback(async (files: File[]) => {
    try {
      for (const file of files) {
        let uploadableFile: UploadFileItem | undefined;
        if (
          (uploadableFile = fileList?.find?.(
            (el) => el.FileName === file.name
          ))
        ) {
          await retryUpload(uploadableFile.uid);
          continue;
        }
        if (file.name && file.size > 0) {
          await addFiles([file]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [fileList, addFiles, retryUpload]);

  // 处理粘贴事件，检测是否粘贴了图片
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // 如果有图片文件，则调用文件上传方法
    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleFileUpload(imageFiles);
    }
  }, [handleFileUpload]);

  return (
    <Form {...form}>
      <form className="h-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 h-full">
          <div className="h-full">
            <div className="p-2 sm:p-4">
              <div className="flex items-center gap-2">
                {/* Desktop buttons - visible on md and larger screens */}
                <div className="hidden md:flex items-center gap-1">
                  <FormField
                    control={form.control}
                    name="imgURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Button
                            className=""
                            variant={"ghost"}
                            size="icon"
                            disabled={fileUploadLoading}
                            onClick={(e) => {
                              e.preventDefault();
                              uploadBtnRef.current?.click();
                            }}
                          >
                            <IoImageOutline />
                          </Button>
                        </FormLabel>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="image-upload-input"
                          ref={uploadBtnRef}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              await handleFileUpload(Array.from(files));
                            }
                          }}
                        />
                        <FormControl>
                          <input
                            {...field}
                            className="hidden"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={"ghost"}
                        onClick={(e) => {
                          e.preventDefault();
                          const text = normanizeText(
                            form.getValues("text")
                          );
                          form.setValue("text", text ?? "");
                        }}
                      >
                        <MdAutoFixHigh />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t("Format Text")}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          ttsLoading || !form.getValues("text")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const text = form.getValues("text")
                          if(!text) {
                            return
                          }
                          handleTTS(text);
                        }}
                      >
                        <MdVolumeUp />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t("Text-to-Speech")}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Mobile dropdown menu - visible on small screens */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MdMoreVert />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          uploadBtnRef.current?.click();
                        }}
                        disabled={fileUploadLoading}
                      >
                        <IoImageOutline className="mr-2 h-4 w-4" />
                        <span>{t("Upload Image")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          const text = normanizeText(form.getValues("text"));
                          form.setValue("text", text ?? "");
                        }}
                      >
                        <MdAutoFixHigh className="mr-2 h-4 w-4" />
                        <span>{t("Format Text")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const text = form.getValues("text")
                          if(!text) {
                            return
                          }
                          handleTTS(text);
                        }}
                        disabled={ttsLoading || !form.getValues("text")}
                      >
                        <MdVolumeUp className="mr-2 h-4 w-4" />
                        <span>{t("Text-to-Speech")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Translate button - always visible */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      key="submit"
                      type="submit"
                      disabled={
                        loading || form.formState.isSubmitting
                      }
                      className="flex-1 md:flex-none"
                    >
                      <MdOutlineTranslate />
                      <span className="ml-2 hidden sm:inline">
                        {loading
                          ? t("Loading") + "..."
                          : t("Translate")}
                      </span>
                      <span className="ml-2 sm:hidden">
                        {loading ? "..." : t("Translate")}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("Press Alt + Enter to submit")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-1"></div>
              <div className="relative mt-2 sm:mt-0">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <InputGroupTextarea
                            {...field}
                            className="min-h-[200px] sm:h-60 text-sm sm:text-base 2xl:text-lg resize-y"
                            placeholder={t(
                              "Enter Japanese text here\nExample: こんにちは、元気ですか？\nAlt + Q to focus input"
                            )}
                            onPaste={handlePaste}
                          />
                          <InputGroupAddon align="block-end">
                            <div className="flex items-center gap-1">
                              <FormField
                                control={form.control}
                                name="imgURL"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      <InputGroupButton
                                        variant="ghost"
                                        size="icon-xs"
                                        disabled={fileUploadLoading}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          uploadBtnRef.current?.click();
                                        }}
                                      >
                                        <IoImageOutline />
                                      </InputGroupButton>
                                    </FormLabel>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      id="image-upload-input"
                                      ref={uploadBtnRef}
                                      onChange={async (e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                          await handleFileUpload(Array.from(files));
                                        }
                                      }}
                                    />
                                    <FormControl>
                                      <input
                                        {...field}
                                        className="hidden"
                                        type="text"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InputGroupButton
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const text = normanizeText(
                                        form.getValues("text")
                                      );
                                      form.setValue("text", text ?? "");
                                    }}
                                  >
                                    <MdAutoFixHigh />
                                  </InputGroupButton>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {t("Format Text")}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InputGroupButton
                                    variant="ghost"
                                    size="icon-xs"
                                    disabled={
                                      ttsLoading || !form.getValues("text")
                                    }
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const text = form.getValues("text")
                                      if(!text) {
                                        return
                                      }
                                      handleTTS(text);
                                    }}
                                  >
                                    <MdVolumeUp />
                                  </InputGroupButton>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {t("Text-to-Speech")}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* 高亮遮罩层 */}
                {highlightPosition && (
                  <div className="absolute left-0 top-0 inset-0 pointer-events-none z-20">
                    <TextHighlightMask
                      text={form.getValues("text") || ""}
                      position={highlightPosition}
                    />
                  </div>
                )}
              </div>

              <FileUploadSection
                fileList={fileList}
                removeFile={removeFile}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}