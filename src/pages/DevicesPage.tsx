import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Toast } from '~/components/ToastCompat'
import { useAuthActions } from '~/store/auth'
import { Device } from '~/types/auth'
import { getErrorMessage, isStandardizedError } from '~/utils/request'
import { HydrateFallbackTemplate } from '~/components/HydrateFallbackTemplate'

export function meta() {
  return [
    { title: 'Devices' },
    { name: 'description', content: 'Manage your connected devices' },
  ]
}

export default function DevicesPage() {
  const { t } = useTranslation()
  const { getDevices, revokeDevice } = useAuthActions()
  const [devices, setDevices] = useState<Device[]>([])

  // Fetch devices
  const { loading: devicesLoading, run: fetchDevices } = useRequest(
    async () => {
      try {
        const devicesData = await getDevices()
        setDevices(devicesData)
      } catch (error) {
        console.error('Failed to fetch devices:', error)
        Toast.error(t('Failed to load devices'))
      }
    },
    { manual: true }
  )

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleRevokeDevice = async (deviceId: number) => {
    try {
      await revokeDevice(deviceId)
      Toast.success(t('Device revoked successfully'))
      fetchDevices() // Refresh the list
    } catch (error) {
      console.error('Failed to revoke device:', error)
      if (isStandardizedError(error)) {
        Toast.error(getErrorMessage(error) || t('Failed to revoke device'))
      } else {
        Toast.error(t('Failed to revoke device'))
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

  const isCurrentDevice = (device: Device) => {
    // This would need to be implemented based on how device identification works
    // For now, we'll assume the first device is the current one
    return devices.length > 0 && device.id === devices[0].id
  }

  if (devicesLoading) {
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
          <h1 className="text-3xl font-bold">{t('Connected Devices')}</h1>
        </div>

        {/* Devices List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Your Devices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('No devices found')}
                </div>
              ) : (
                devices.map((device) => (
                  <div key={device.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-2">
                            {device.device_name}
                            {isCurrentDevice(device) && (
                              <Badge variant="secondary" className="text-xs">
                                {t('Current')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {device.ip_address} • {t('Last used')}: {formatDate(device.last_used)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('Connected')}: {formatDate(device.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrentDevice(device) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeDevice(device.id)}
                          >
                            {t('Revoke')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('Device Management')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t('Device management allows you to see all devices that are currently logged into your account.')}</p>
              <p>{t('You can revoke access for any device except the one you are currently using.')}</p>
              <p>{t('Revoking a device will immediately log it out and invalidate its access tokens.')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const HydrateFallback = HydrateFallbackTemplate