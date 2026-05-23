'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@aah/ui'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { apiPath } from '@/lib/api-path'

interface StudyHallSectionProps {
  studentProfileId: string
}

interface StudyHallStats {
  totalHours: number
  requiredHours: number
  completionPercentage: number
  sessionsCount: number
  averageSessionDuration: number
  recentSessions: Array<{
    id: string
    location: string
    checkInTime: string
    checkOutTime?: string
    duration?: number
  }>
}

export function StudyHallSection({ studentProfileId }: StudyHallSectionProps) {
  const [stats, setStats] = useState<StudyHallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(apiPath(`/api/support/study-hall/stats/${studentProfileId}`))
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message ?? 'Failed to load study hall stats')
        }

        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load study hall stats')
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [studentProfileId])

  async function handleCheckIn() {
    setCheckingIn(true)
    setError(null)
    setCheckInMessage(null)

    try {
      const response = await fetch(apiPath('/api/support/study-hall/checkin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentProfileId,
          location: 'Main Study Hall',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to check in')
      }

      setCheckInMessage('Checked in successfully. Remember to check out when you leave.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Hall Sessions</CardTitle>
        <CardDescription>
          Track mandatory study hall hours and recent attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading study hall progress...</p>
        )}

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {stats && (
          <div className="mb-6 rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">Weekly progress</p>
              <Button size="sm" disabled={checkingIn} onClick={() => void handleCheckIn()}>
                Check In
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.totalHours.toFixed(1)} of {stats.requiredHours} required hours completed
              ({Math.round(stats.completionPercentage)}%)
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.sessionsCount} recent sessions • avg {Math.round(stats.averageSessionDuration)} min
            </p>
            {checkInMessage && (
              <p className="text-sm text-green-700">{checkInMessage}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {stats?.recentSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-primary transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-brand-primary" />
                  <div>
                    <h4 className="font-semibold">
                      {new Date(session.checkInTime).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(session.checkInTime).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {session.checkOutTime &&
                        ` – ${new Date(session.checkOutTime).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {session.location}
                  </div>
                  {session.duration != null && (
                    <span>{session.duration} minutes</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && stats?.recentSessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent study hall sessions on record.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
