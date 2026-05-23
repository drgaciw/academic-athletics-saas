'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@aah/ui'
import { Calendar, Users, Award } from 'lucide-react'
import { apiPath } from '@/lib/api-path'

interface WorkshopsSectionProps {
  studentProfileId: string
}

interface Workshop {
  id: string
  title: string
  scheduledAt: string
  duration: number
  instructor: string
  capacity: number
  registered: number
  available: number
  category: string
}

export function WorkshopsSection({ studentProfileId }: WorkshopsSectionProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [registeredId, setRegisteredId] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkshops() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(apiPath('/api/support/workshop/available'))
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message ?? 'Failed to load workshops')
        }

        setWorkshops(data.workshops ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workshops')
      } finally {
        setLoading(false)
      }
    }

    void loadWorkshops()
  }, [])

  async function handleRegister(workshopId: string) {
    setRegisteringId(workshopId)
    setError(null)

    try {
      const response = await fetch(apiPath('/api/support/workshop/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentProfileId, workshopId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to register for workshop')
      }

      setRegisteredId(workshopId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register for workshop')
    } finally {
      setRegisteringId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Workshops</CardTitle>
        <CardDescription>
          Personal and professional development opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading workshops...</p>
        )}

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {!loading && workshops.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No workshops are open for registration right now.</p>
        )}

        <div className="space-y-4">
          {workshops.map((workshop) => (
            <div
              key={workshop.id}
              className="border rounded-lg p-4 hover:border-brand-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{workshop.title}</h4>
                    <Badge variant="secondary">{workshop.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {workshop.instructor}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={registeringId === workshop.id || registeredId === workshop.id}
                  onClick={() => void handleRegister(workshop.id)}
                >
                  {registeredId === workshop.id ? 'Registered' : 'Register'}
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(workshop.scheduledAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {' '}({workshop.duration} min)
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {workshop.registered}/{workshop.capacity} registered
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
