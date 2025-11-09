'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@aah/ui'
import { Calendar, MapPin, Users } from 'lucide-react'

const mockStudyHalls = [
  {
    id: '1',
    day: 'Monday',
    time: '6:00 PM - 8:00 PM',
    location: 'Academic Center Room 201',
    capacity: '15 students',
    available: 8,
  },
  {
    id: '2',
    day: 'Wednesday',
    time: '7:00 PM - 9:00 PM',
    location: 'Library Study Room A',
    capacity: '12 students',
    available: 5,
  },
  {
    id: '3',
    day: 'Friday',
    time: '5:00 PM - 7:00 PM',
    location: 'Academic Center Room 305',
    capacity: '20 students',
    available: 12,
  },
]

export function StudyHallSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Hall Sessions</CardTitle>
        <CardDescription>
          Structured study time with academic support staff
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockStudyHalls.map((hall) => (
            <div
              key={hall.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-primary transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-brand-primary" />
                  <div>
                    <h4 className="font-semibold">{hall.day}</h4>
                    <p className="text-sm text-gray-600">{hall.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {hall.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {hall.available} spots available
                  </div>
                </div>
              </div>
              <Button size="sm">Reserve Spot</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}