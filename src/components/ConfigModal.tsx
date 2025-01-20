import { useForm } from 'react-hook-form'
import { useState } from 'react'

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
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">API 配置</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              DeepSeek API URL
            </label>
            <input
              {...register("apiUrl", { required: "API URL 是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入 API URL"
            />
            {errors.apiUrl && (
              <p className="mt-2 text-sm text-red-600">{errors.apiUrl.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              DeepSeek API Key
            </label>
            <input
              type="password"
              {...register("apiKey", { required: "API Key 是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入 API Key"
            />
            {errors.apiKey && (
              <p className="mt-2 text-sm text-red-600">{errors.apiKey.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              模型
            </label>
            <input
              {...register("model", { required: "模型名称是必填项" })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入模型名称"
            />
            {errors.model && (
              <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">OpenAI TTS 配置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  OpenAI API URL
                </label>
                <input
                  {...register("openaiApiUrl", { required: "OpenAI API URL 是必填项" })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="请输入 OpenAI API URL"
                />
                {errors.openaiApiUrl && (
                  <p className="mt-2 text-sm text-red-600">{errors.openaiApiUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  OpenAI TTS API Key
                </label>
                <input
                  type="password"
                  {...register("openaiApiKey", { required: "OpenAI API Key 是必填项" })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="请输入 OpenAI API Key"
                />
                {errors.openaiApiKey && (
                  <p className="mt-2 text-sm text-red-600">{errors.openaiApiKey.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  TTS 音声
                </label>
                <select
                  {...register("voice")}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 