import { useRef } from "react";
import { useKeyPress } from "ahooks";
import { MdAutoFixHigh, MdOutlineTranslate, MdVolumeUp } from "react-icons/md";
import { IoImageOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
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

  return (
    <Form {...form}>
      <form className="h-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="h-full">
            <div className="p-4">
              <div className="flex">
                <FormField
                  control={form.control}
                  name="imgURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Button
                          className=""
                          variant={"ghost"}
                          disabled={fileUploadLoading}
                          onClick={(e) => {
                            e.preventDefault();
                            uploadBtnRef.current?.click();
                          }}
                        >
                          <IoImageOutline></IoImageOutline>
                        </Button>
                      </FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="image-upload-input"
                        ref={uploadBtnRef}
                        onChange={async (e) => {
                          try {
                            const thisFile = e.target.files?.[0];
                            let uploadableFile: UploadFileItem | undefined;
                            if (
                              (uploadableFile = fileList?.find?.(
                                (el) => el.FileName === thisFile?.name
                              ))
                            ) {
                              await retryUpload(uploadableFile.uid);
                              return;
                            }
                            if (thisFile?.name && thisFile.size > 0) {
                              await addFiles([thisFile]);
                            }
                          } catch (error) {
                            console.error(error);
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
                        handleTTS(form.getValues("text"));
                      }}
                    >
                      <MdVolumeUp />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("Text-to-Speech")}
                  </TooltipContent>
                </Tooltip>
                <div className="p-1"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      key="submit"
                      type="submit"
                      disabled={
                        loading || form.formState.isSubmitting
                      }
                    >
                      <MdOutlineTranslate />
                      {loading
                        ? t("Loading") + "..."
                        : t("Translate")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("Press Alt + Enter to submit")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-1"></div>
              <div className="relative">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="h-60 text-base 2xl:text-lg"
                          placeholder={t(
                            "Enter Japanese text here\nExample: こんにちは、元気ですか？\nAlt + Q to focus input"
                          )}
                        />
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