import { useState, useEffect } from 'react'
import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Toast } from '~/components/ToastCompat'
import { useAuthActions } from '~/store/auth'
import { Session, SessionStats } from '~/types/auth'
import { getErrorMessage, isStandardizedError } from '~/utils/request'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'

export function meta() {
  return [
    { title: 'Sessions' },
    { name: 'description', content: 'Manage your active sessions' },
  ]
}

export default function SessionsPage() {
  const { t } = useTranslation()
  const { getSessions, revokeAllSessions, getSessionStats } = useAuthActions()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [password, setPassword] = useState('')

  // Fetch sessions
  const { loading: sessionsLoading, run: fetchSessions } = useRequest(
    async () => {
      try {
        const sessionsData = await getSessions()
        setSessions(sessionsData)
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
        Toast.error(t('Failed to load sessions'))
      }
    },
    { manual: true }
  )

  // Fetch session stats
  const { run: fetchSessionStats } = useRequest(
    async () => {
      try {
        const stats = await getSessionStats()
        setSessionStats(stats)
      } catch (error) {
        console.error('Failed to fetch session stats:', error)
      }
    },
    { manual: true }
  )

  useEffect(() => {
    fetchSessions()
    fetchSessionStats()
  }, [])

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessions(password)
      Toast.success(t('All sessions revoked successfully'))
      setIsRevokeDialogOpen(false)
      setPassword('')
      fetchSessions()
      fetchSessionStats()
    } catch (error) {
      console.error('Failed to revoke sessions:', error)
      if (isStandardizedError(error)) {
        Toast.error(getErrorMessage(error) || t('Failed to revoke sessions'))
      } else {
        Toast.error(t('Failed to revoke sessions'))
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isCurrentSession = (session: Session) => {
    const currentToken = localStorage.getItem('refresh_token')
    return session.token === currentToken
  }

  if (sessionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{t('Loading')}...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('Active Sessions')}</h1>
        </div>

        {/* Session Stats */}
        {sessionStats && (
          <Card>
            <CardHeader>
              <CardTitle>{t('Session Statistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {sessionStats.total_sessions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('Total Sessions')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionStats.active_sessions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('Active Sessions')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionStats.devices.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('Devices')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Active Sessions')}</CardTitle>
            <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  {t('Revoke All Sessions')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('Revoke All Sessions')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('This will log you out from all devices except this one. Please enter your password to confirm.')}
                  </p>
                  <Input
                    type="password"
                    placeholder={t('Enter your password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRevokeDialogOpen(false)}
                    >
                      {t('Cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRevokeAllSessions}
                      disabled={!password}
                    >
                      {t('Confirm Revoke')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No active sessions found')}
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-2">
                            {session.device_name}
                            {isCurrentSession(session) && (
                              <Badge variant="secondary" className="text-xs">
                                {t('Current')}
                              </Badge>
                            )}
                            {session.revoked && (
                              <Badge variant="destructive" className="text-xs">
                                {t('Revoked')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.ip_address} • {session.user_agent}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{t('Last used')}: {formatDate(session.last_used_at)}</div>
                        <div>{t('Created')}: {formatDate(session.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const HydrateFallback = HydrateFallbackTemplate