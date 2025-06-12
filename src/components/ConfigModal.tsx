import { useForm } from 'react-hook-form'
import { Button } from './Button'
import { Select } from './Select'

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
  const { register, handleSubmit, formState: { errors } } = useForm<ConfigFormData>({
    defaultValues: {
      apiUrl: initialConfig.apiUrl || 'https://api.deepseek.com/chat/completions',
      apiKey: initialConfig.apiKey || '',
      model: initialConfig.model || 'deepseek-chat',
      openaiApiUrl: initialConfig.openaiApiUrl || 'https://api.openai.com/v1',
      openaiApiKey: initialConfig.openaiApiKey || '',
      voice: initialConfig.voice || 'alloy'
    }
  })

  if (!isOpen) return null

  const onSubmit = (data: ConfigFormData) => {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">API 配置</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Openai Compatible API URL
            </label>
            <input
              {...register("apiUrl", { required: "API URL 是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入 API URL"
            />
            {errors.apiUrl && (
              <p className="mt-2 text-sm text-red-600">{errors.apiUrl.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Openai Compatible API Key
            </label>
            <input
              type="password"
              {...register("apiKey", { required: "API Key 是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入 API Key"
            />
            {errors.apiKey && (
              <p className="mt-2 text-sm text-red-600">{errors.apiKey.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              模型
            </label>
            <input
              {...register("model", { required: "模型名称是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入模型名称"
            />
            {errors.model && (
              <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">OpenAI TTS 配置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI API URL
                </label>
                <input
                  {...register("openaiApiUrl", { required: "OpenAI API URL 是必填项" })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="请输入 OpenAI API URL"
                />
                {errors.openaiApiUrl && (
                  <p className="mt-2 text-sm text-red-600">{errors.openaiApiUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI TTS API Key
                </label>
                <input
                  type="password"
                  {...register("openaiApiKey", { required: "OpenAI API Key 是必填项" })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="请输入 OpenAI API Key"
                />
                {errors.openaiApiKey && (
                  <p className="mt-2 text-sm text-red-600">{errors.openaiApiKey.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  TTS 音声
                </label>
                <Select
                  {...register("voice")}
                  options={[
                    { value: 'alloy', label: 'Alloy' },
                    { value: 'echo', label: 'Echo' },
                    { value: 'fable', label: 'Fable' },
                    { value: 'onyx', label: 'Onyx' },
                    { value: 'nova', label: 'Nova' },
                    { value: 'shimmer', label: 'Shimmer' }
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button type="button" onClick={onClose} variant="secondary">
              取消
            </Button>
            <Button type="submit">
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
