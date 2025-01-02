import { useState, useEffect } from 'react'
import './App.css'
import type { TranslationResult } from './types/jp_ast'
import axios from 'axios'
import { translate_prompt } from './prompt'
import { ConfigModal } from './components/ConfigModal'

function App() {
  const [inputText, setInputText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<'zh' | 'ja'>('ja')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('translationConfig')
    return savedConfig ? JSON.parse(savedConfig) : {
      apiUrl: 'https://api.deepseek.com/chat/completions',
      apiKey: ''
    }
  })

  // 从 URL 读取初始文本
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const textFromUrl = searchParams.get('text')
    const langFromUrl = searchParams.get('lang') as 'zh' | 'ja'
    
    if (textFromUrl) {
      setInputText(decodeURIComponent(textFromUrl))
    }
    if (langFromUrl && (langFromUrl === 'zh' || langFromUrl === 'ja')) {
      setSourceLanguage(langFromUrl)
    }
  }, [])

  // 更新 URL
  const updateUrl = (text: string, lang: 'zh' | 'ja') => {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('text', encodeURIComponent(text))
    newUrl.searchParams.set('lang', lang)
    window.history.pushState({}, '', newUrl)
  }

  const handleSaveConfig = (newConfig: { apiUrl: string; apiKey: string }) => {
    setConfig(newConfig)
    localStorage.setItem('translationConfig', JSON.stringify(newConfig))
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    if (!config.apiKey) {
      setIsConfigModalOpen(true)
      return
    }
    
    setLoading(true)
    try {
      const response = await axios({
        method: 'post',
        url: config.apiUrl,
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${config.apiKey}`
        },
        data: {
          "model": "deepseek-chat",
          "messages": [
            {"role": "system", "content": translate_prompt},
            {"role": "user", "content": inputText}
          ],
          "stream": false
        },
      })
      console.log(response)
      const data: TranslationResult = JSON.parse(response.data.choices?.[0]?.message?.content) 
      setTranslation(data)
      updateUrl(inputText, sourceLanguage)
    } catch (error) {
      console.error('翻译出错:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = () => {
    if (!translation) return
    setInputText(translation.translation)
    setSourceLanguage(sourceLanguage === 'zh' ? 'ja' : 'zh')
    setTranslation(null)
  }

  return (
    <div className="h-screen bg-gray-100 p-4 flex flex-col">
      <div className="max-w-6xl mx-auto flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">中日翻译</h1>
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
        
        {/* 语言选择 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${
              sourceLanguage === 'zh' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSourceLanguage('zh')}
          >
            中文
          </button>
          <button
            className={`px-4 py-2 rounded ${
              sourceLanguage === 'ja' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSourceLanguage('ja')}
          >
            日本語
          </button>
        </div>

        {/* 主要内容区域 - 使用网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
          {/* 左侧输入区域 */}
          <div className="md:col-span-5 space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={sourceLanguage === 'zh' ? "请输入中文" : "日本語を入力してください"}
            />
          </div>

          {/* 右侧结果区域 */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative h-full">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : null}
              <div className="h-full flex flex-col bg-white rounded-lg border">
                {translation ? (
                  <>
                    {/* 固定的翻译结果区域 */}
                    <div className="p-4 border-b">
                      <p className="text-gray-700">{translation.translation}</p>
                    </div>
                    
                    {/* 可滚动的详细解释区域 */}
                    <div className="flex-1 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                      <div className="flex flex-wrap gap-3">
                        {translation.ast.tokens.map((token, index) => (
                          <div key={index} className="inline-flex items-center bg-gray-50 rounded-lg p-2 shadow-sm">
                            <span className="text-gray-900 font-medium">{token.word}</span>
                            <div className="flex gap-2 ml-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {token.pos}
                              </span>
                              {token.lemma && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  原型: {token.lemma}
                                </span>
                              )}
                              {token.inflection && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  变形: {token.inflection}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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

        {/* 底部按钮区域 */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? '翻译中...' : '翻译'}
          </button>
          
          {translation && (
            <button
              onClick={handleSwitch}
              className="px-8 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              交换
            </button>
          )}
        </div>

        <ConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleSaveConfig}
          initialConfig={config}
        />
      </div>
    </div>
  )
}

export default App