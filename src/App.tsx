import { useState, useEffect } from 'react'
import './App.css'
import type { TranslationResult } from './types/jp_ast'
// import axios from 'axios'
import { translate_prompt } from './prompt'
import { ConfigModal } from './components/ConfigModal'
import { Tag } from './components/Tag'
import { useForm } from 'react-hook-form'
import { jsonrepair } from 'jsonrepair'
// import { zodResolver } from '@hookform/resolvers/zod'
import { type TranslationFormData } from './schemas/translation'
import { Toast } from './components/Toast'
import { db, type TranslationHistory } from './db/database'
import { useThrottle } from 'ahooks'
import { Cursor } from './components/Cursor'
import { AstTokens } from './components/AstTokens'

interface Message {
  role: string; // 可以是 "system", "user", 或 "assistant"
  content: string;
}

interface Choice {
  index: number;
  message: Message;
  logprobs: null | any; // 根据实际情况可以进一步定义 logprobs 的类型
  finish_reason: string; // 例如 "stop", "length", 或其他原因
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens: number;
  prompt_cache_miss_tokens: number;
}

interface ChatCompletion {
  id: string;
  object: string; // 例如 "chat.completion"
  created: number; // 时间戳
  model: string; // 例如 "deepseek-chat"
  choices: Choice[];
  usage: Usage;
  system_fingerprint: string;
}


function App() {
  // const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('translationConfig')
    return savedConfig ? JSON.parse(savedConfig) : {
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: '',
      model: 'deepseek-chat',
      openaiApiUrl: 'https://api.openai.com/v1',
      openaiApiKey: '',
      voice: 'alloy'
    }
  })
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [bufferedTranslation, setBufferedTranslation] = useState<TranslationResult | null>(null)

  // 添加 TTS loading 状态
  const [ttsLoading, setTtsLoading] = useState<{
    original: boolean;
    translation: boolean;
  }>({
    original: false,
    translation: false,
  });

  const form = useForm<TranslationFormData>({
    defaultValues: {
      text: '',
      sourceLanguage: 'ja',
    }
  })

  // 从 URL 读取初始文本
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const textFromUrl = searchParams.get('text')
    const langFromUrl = searchParams.get('lang') as 'zh' | 'ja'
    
    if (textFromUrl) {
      form.setValue('text', decodeURIComponent(textFromUrl))
    }
    if (langFromUrl && (langFromUrl === 'zh' || langFromUrl === 'ja')) {
      form.setValue('sourceLanguage', langFromUrl)
    }
  }, [form])

  // 更新 URL
  const updateUrl = (data: TranslationFormData) => {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('text', encodeURIComponent(data.text))
    window.history.pushState({}, '', newUrl)
  }

  const handleSaveConfig = (newConfig: { 
    apiUrl: string; 
    apiKey: string; 
    openaiApiUrl: string; 
    openaiApiKey: string; 
  }) => {
    setConfig(newConfig)
    localStorage.setItem('translationConfig', JSON.stringify(newConfig))
  }

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      const records = await db.translations
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray()
      setHistory(records)
    }
    loadHistory()
  }, [])

  const translation = useThrottle<TranslationResult | null>(bufferedTranslation, {
    wait: 300
  })


  const onSubmit = async (data: TranslationFormData) => {
    if (!config.apiKey) {
      setIsConfigModalOpen(true)
      return
    }
    
    setLoading(true)
    setBufferedTranslation(null)
    let fullResponse = ''
    
    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: (JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: translate_prompt },
            { role: "user", content: data.text.trim() }
          ],
          stream: true
        }))
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get reader')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5)
            if (data === '[DONE]' || data === '') continue
            
            try {
              const json = JSON.parse(data)
              const content = json.choices[0]?.delta?.content || ''
              fullResponse += content
              
              try {
                // 尝试解析累积的响应，更新到缓存变量
                const translationData = JSON.parse(jsonrepair(fullResponse)) as TranslationResult
                setBufferedTranslation(() => {
                  return translationData
                })
              } catch(error) {
                console.error(error)
                // JSON 还不完整，继续累积
              }
            } catch (e) {
              console.error('解析流数据失败:', e)
            }
          }
        }
      }

      // 完成后保存到历史记录
      try {
        const finalTranslationData = JSON.parse(jsonrepair(fullResponse)) as TranslationResult
        if (finalTranslationData && finalTranslationData.translation) {
          const historyRecord: TranslationHistory = {
            sourceText: data.text.trim(),
            translation: finalTranslationData.translation,
            ast: finalTranslationData.ast,
            timestamp: new Date()
          }
          
          await db.translations.add(historyRecord)
          setHistory(prev => [historyRecord, ...prev])
          
          // 最后一次更新确保显示完整结果
          // setTranslation(finalTranslationData)
        }
      } catch (e) {
        console.error('保存历史记录失败:', e)
      }

      updateUrl(data)
    } catch (error) {
      console.error('翻译出错:', error)
      Toast.error('翻译失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleTTS = async (text: string, type: 'original' | 'translation') => {
    if (!text || !config.openaiApiKey || ttsLoading[type]) return;
    
    if (!config.openaiApiKey) {
      Toast.error('请先配置 OpenAI API Key');
      setIsConfigModalOpen(true);
      return;
    }
    
    try {
      setTtsLoading(prev => ({ ...prev, [type]: true }));
      
      const response = await fetch(`${config.openaiApiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: config.voice
        })
      });

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      Toast.error('语音合成失败，请重试');
    } finally {
      setTtsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden flex">
      {/* 侧边栏历史记录 */}
      <div className={`fixed md:relative ${isHistoryCollapsed ? 'w-16' : 'w-80'} h-screen bg-white shadow-lg 
        transition-all duration-300 transform ${
        showHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } z-20`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            {!isHistoryCollapsed && <h2 className="text-lg font-semibold">翻译历史</h2>}
            <button 
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className="hidden md:block text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isHistoryCollapsed 
                    ? "M13 5l7 7-7 7M5 5l7 7-7 7" 
                    : "M11 19l-7-7 7-7M19 19l-7-7 7-7"
                  } 
                />
              </svg>
            </button>
            {!isHistoryCollapsed && (
              <button 
                onClick={() => setShowHistory(false)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.map((record, index) => (
              <div 
                key={record.id || index} 
                className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  form.setValue('text', record.sourceText)
                  setShowHistory(false)
                }}
              >
                {isHistoryCollapsed ? (
                  <div className="text-center text-gray-500 text-sm">
                    {index + 1}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-700 line-clamp-2">{record.sourceText}</div>
                    <div className="text-sm text-gray-900 line-clamp-2 mt-1">{record.translation}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 遮罩层 - 移动端显示 */}
      {showHistory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setShowHistory(false)}
        ></div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">日中翻译</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="md:hidden px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                历史记录
              </button>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                配置
              </button>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1">
              <div className="md:col-span-5 space-y-5">
                <div className="relative">
                  <textarea
                    {...form.register('text')}
                    className="w-full h-[50vh] md:h-[70vh] p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="日本語を入力してください"
                  />
                  {/* 原文区域的 TTS 按钮 */}
                  {form.getValues('text') && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleTTS(form.getValues('text'), 'original');
                      }}
                      disabled={ttsLoading.original}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                        ttsLoading.original 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="播放原文语音"
                    >
                      {ttsLoading.original ? (
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                {form.formState.errors.text && (
                  <p className="text-red-500 text-sm">{form.formState.errors.text.message}</p>
                )}
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="relative h-[50vh] md:h-[70vh]">
                  {loading && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  <div className="h-full flex flex-col bg-white rounded-lg border">
                    {translation || loading ? (
                      <>
                        <div className="p-4 border-b max-h-[40%] overflow-auto">
                          <div className="flex justify-between items-start">
                            <p className="text-gray-700">
                              {translation?.translation}
                              {loading && <Cursor />}
                            </p>
                            {translation?.translation && !loading && (
                              <button
                                onClick={() => handleTTS(translation.translation ?? "", 'translation')}
                                disabled={ttsLoading.translation}
                                className={`ml-2 p-2 rounded-full transition-all duration-200 ${
                                  ttsLoading.translation 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                                title="播放翻译语音"
                              >
                                {ttsLoading.translation ? (
                                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l5.5-3.212a.5.5 0 000-.858l-5.5-3.212a.5.5 0 00-.757.43z" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                          <AstTokens 
                            ast={translation?.ast} 
                            loading={loading} 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        翻译结果将在这里显示
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-4 md:mt-8 mb-4 md:mb-6">
              <button
                type="submit"
                disabled={loading || form.formState.isSubmitting}
                className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {loading ? '翻译中...' : '翻译'}
              </button>
            </div>
          </form>

          <ConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onSave={handleSaveConfig}
            initialConfig={config}
          />
        </div>
      </div>
    </div>
  )
}

export default App
