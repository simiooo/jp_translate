import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

// Zod validation schema
const configSchema = z.object({
  apiUrl: z.string().url('请输入有效的 API URL').min(1, 'API URL 是必填项'),
  apiKey: z.string().min(1, 'API Key 是必填项'),
  model: z.string().min(1, '模型名称是必填项'),
  openaiApiUrl: z.string().url('请输入有效的 OpenAI API URL').min(1, 'OpenAI API URL 是必填项'),
  openaiApiKey: z.string().min(1, 'OpenAI API Key 是必填项'),
  voice: z.string().min(1, '请选择音声'),
});

export interface ConfigFormData {
  apiUrl: string
  apiKey: string
  model: string
  openaiApiUrl: string
  openaiApiKey: string
  voice: string
}

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ConfigFormData) => void
  initialConfig: ConfigFormData
}

export function ConfigModal({ isOpen, onClose, onSave, initialConfig }: ConfigModalProps) {
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      apiUrl: initialConfig.apiUrl || 'https://api.deepseek.com/chat/completions',
      apiKey: initialConfig.apiKey || '',
      model: initialConfig.model || 'deepseek-chat',
      openaiApiUrl: initialConfig.openaiApiUrl || 'https://api.openai.com/v1',
      openaiApiKey: initialConfig.openaiApiKey || '',
      voice: initialConfig.voice || 'alloy'
    }
  })

  const onSubmit = (data: z.infer<typeof configSchema>) => {
    onSave({
      apiUrl: data.apiUrl.trim(),
      apiKey: data.apiKey.trim(),
      model: data.model.trim(),
      openaiApiUrl: data.openaiApiUrl.trim(),
      openaiApiKey: data.openaiApiKey.trim(),
      voice: data.voice.trim()
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">API 配置</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Openai Compatible API URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入 API URL"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Openai Compatible API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="请输入 API Key"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模型</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入模型名称"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">OpenAI TTS 配置</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="openaiApiUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI API URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入 OpenAI API URL"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="openaiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI TTS API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="请输入 OpenAI API Key"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TTS 音声</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择音声" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alloy">Alloy</SelectItem>
                            <SelectItem value="echo">Echo</SelectItem>
                            <SelectItem value="fable">Fable</SelectItem>
                            <SelectItem value="onyx">Onyx</SelectItem>
                            <SelectItem value="nova">Nova</SelectItem>
                            <SelectItem value="shimmer">Shimmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <Button type="button" onClick={onClose} variant="secondary">
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
