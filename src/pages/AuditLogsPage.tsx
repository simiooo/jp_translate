import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Toast } from '~/components/ToastCompat'
import { useAuthActions } from '~/store/auth'
import { AuditLog } from '~/types/auth'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'

export function meta() {
  return [
    { title: 'Audit Logs' },
    { name: 'description', content: 'View your authentication audit logs' },
  ]
}

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const { getAuditLogs } = useAuthActions()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    email: '',
    event_type: '',
    success: '',
    limit: 50,
    offset: 0,
  })

  // Fetch audit logs
  const { loading: logsLoading, run: fetchAuditLogs } = useRequest(
    async () => {
      try {
        const params: Record<string, string | number | boolean> = { ...filters }
        if (params.success !== '') {
          params.success = params.success === 'true'
        }
        const response = await getAuditLogs(params)
        setLogs(response.data.logs)
        setTotal(response.data.total)
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
        Toast.error(t('Failed to load audit logs'))
      }
    },
    { manual: true }
  )

  useEffect(() => {
    fetchAuditLogs()
  }, [filters.limit, filters.offset])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }))
  }

  const handleSearch = () => {
    fetchAuditLogs()
  }

  const handleReset = () => {
    setFilters({
      email: '',
      event_type: '',
      success: '',
      limit: 50,
      offset: 0,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return 'bg-blue-100 text-blue-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      case 'register':
        return 'bg-green-100 text-green-800'
      case 'password_change':
        return 'bg-orange-100 text-orange-800'
      case 'email_verification':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalPages = Math.ceil(total / filters.limit)
  const currentPage = Math.floor(filters.offset / filters.limit) + 1

  if (logsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{t('Loading')}...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('Audit Logs')}</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('Email')}</label>
                <Input
                  placeholder={t('Filter by email')}
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('Event Type')}</label>
                <Select value={filters.event_type} onValueChange={(value) => handleFilterChange('event_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('All events')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('All events')}</SelectItem>
                    <SelectItem value="login">{t('Login')}</SelectItem>
                    <SelectItem value="logout">{t('Logout')}</SelectItem>
                    <SelectItem value="register">{t('Register')}</SelectItem>
                    <SelectItem value="password_change">{t('Password Change')}</SelectItem>
                    <SelectItem value="email_verification">{t('Email Verification')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('Status')}</label>
                <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('All status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('All status')}</SelectItem>
                    <SelectItem value="true">{t('Success')}</SelectItem>
                    <SelectItem value="false">{t('Failed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('Results per page')}</label>
                <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="50" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch}>
                {t('Search')}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                {t('Reset')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Audit Logs')}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t('Total')}: {total}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No audit logs found')}
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getEventTypeColor(log.event_type)}>
                            {log.event_type}
                          </Badge>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? t('Success') : t('Failed')}
                          </Badge>
                        </div>
                        <div className="text-sm mb-1">
                          <strong>{log.email}</strong> • {log.ip_address}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {log.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)} • {log.user_agent}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {t('Page')} {currentPage} {t('of')} {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.offset === 0}
                    onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit).toString())}
                  >
                    {t('Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.offset + filters.limit >= total}
                    onClick={() => handleFilterChange('offset', (filters.offset + filters.limit).toString())}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const HydrateFallback = HydrateFallbackTemplate