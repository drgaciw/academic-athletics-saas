'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@aah/ui'
import { Calendar, Users, Award } from 'lucide-react'

const mockWorkshops = [
  {
    id: '1',
    title: 'Time Management for Student-Athletes',
    date: 'Jan 25, 2025',
    time: '3:00 PM',
    instructor: 'Dr. Emily Chen',
    spots: 15,
    registered: 8,
    category: 'Life Skills',
  },
  {
    id: '2',
    title: 'Resume Building Workshop',
    date: 'Jan 28, 2025',
    time: '4:00 PM',
    instructor: 'Career Services',
    spots: 20,
    registered: 12,
    category: 'Career',
  },
  {
    id: '3',
    title: 'Stress Management & Wellness',
    date: 'Feb 1, 2025',
    time: '2:00 PM',
    instructor: 'Wellness Center',
    spots: 25,
    registered: 18,
    category: 'Wellness',
  },
]

export function WorkshopsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Workshops</CardTitle>
        <CardDescription>
          Personal and professional development opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockWorkshops.map((workshop) => (
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
                <Button size="sm">Register</Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {workshop.date} at {workshop.time}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {workshop.registered}/{workshop.spots} registered
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}