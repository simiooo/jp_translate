import { z } from 'zod'

export const translationFormSchema = z.object({
  text: z.string().min(1, '请输入要翻译的文本'),
  sourceLanguage: z.enum(['zh', 'ja'], {
    required_error: '请选择源语言',
  }),
  imgURL: z.string().optional()
})

export type TranslationFormData = z.infer<typeof translationFormSchema> 