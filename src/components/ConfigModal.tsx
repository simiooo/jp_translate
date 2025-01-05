import { useForm } from 'react-hook-form'

interface ConfigFormData {
  apiUrl: string
  apiKey: string
  model: string
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
      model: initialConfig.model || 'deepseek-chat'
    }
  })

  if (!isOpen) return null

  const onSubmit = (data: ConfigFormData) => {
    onSave({
      apiUrl: data.apiUrl.trim(),
      apiKey: data.apiKey.trim(),
      model: data.model.trim()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">API 配置</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API URL
            </label>
            <input
              {...register("apiUrl", { required: "API URL 是必填项" })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入 API URL"
            />
            {errors.apiUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.apiUrl.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              {...register("apiKey", { required: "API Key 是必填项" })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入 API Key"
            />
            {errors.apiKey && (
              <p className="text-red-500 text-sm mt-1">{errors.apiKey.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型
            </label>
            <input
              {...register("model", { required: "模型名称是必填项" })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入模型名称"
            />
            {errors.model && (
              <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 