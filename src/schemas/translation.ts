import { z } from 'zod'

export const translationFormSchema = z.object({
  text: z.string().optional(),
  sourceLanguage: z.enum(['zh', 'ja'], {
    required_error: '请选择源语言',
  }),
  imgURL: z.string().optional()
}).refine((data) => {
  // 至少需要 text 或 imgURL 其中一个
  const hasText = data.text && data.text.trim().length > 0;
  const hasImgURL = data.imgURL && data.imgURL.trim().length > 0;
  return hasText || hasImgURL;
}, {
  message: '请输入文本或上传图片',
  path: ['text'] // 将错误信息显示在 text 字段上
});

export type TranslationFormData = z.infer<typeof translationFormSchema>