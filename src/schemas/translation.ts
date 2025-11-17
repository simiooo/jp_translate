import { z } from 'zod'

export const translationFormSchema = z.object({
  text: z.string().optional(),
  sourceLanguage: z.enum(['zh', 'ja'], {
    required_error: '请选择源语言',
  }),
  imgURL: z.string().optional()
}).refine((data) => {
  // 至少需要 text 或 imgURL 其中一个
  return !!(data.text && data.text.trim().length > 0) || !!(data.imgURL && data.imgURL.trim().length > 0);
}, {
  message: '请输入文本或上传图片',
  path: ['text'] // 将错误信息显示在 text 字段上
}).refine((data) => {
  // 如果有 text，则 text 不能为空
  if (data.text !== undefined && data.text.trim().length === 0) {
    return false;
  }
  return true;
}, {
  message: '请输入要翻译的文本',
  path: ['text']
}).refine((data) => {
  // 如果有 imgURL，则 imgURL 不能为空
  if (data.imgURL !== undefined && data.imgURL.trim().length === 0) {
    return false;
  }
  return true;
}, {
  message: '请上传有效的图片',
  path: ['imgURL']
});

export type TranslationFormData = z.infer<typeof translationFormSchema>