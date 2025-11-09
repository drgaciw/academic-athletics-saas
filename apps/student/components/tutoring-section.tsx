'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@aah/ui'
import { Clock, User, BookOpen } from 'lucide-react'

const mockTutoringSessions = [
  {
    id: '1',
    subject: 'Mathematics',
    tutor: 'Mike Johnson',
    available: ['Mon 2pm', 'Wed 3pm', 'Fri 1pm'],
    topics: ['Calculus', 'Linear Algebra', 'Statistics'],
  },
  {
    id: '2',
    subject: 'Physics',
    tutor: 'Sarah Williams',
    available: ['Tue 4pm', 'Thu 2pm'],
    topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism'],
  },
  {
    id: '3',
    subject: 'English',
    tutor: 'David Brown',
    available: ['Mon 1pm', 'Wed 2pm', 'Fri 3pm'],
    topics: ['Writing', 'Literature', 'Grammar'],
  },
]

export function TutoringSection() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutoring Services</CardTitle>
        <CardDescription>
          Book one-on-one tutoring sessions with peer tutors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTutoringSessions.map((session) => (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:border-brand-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                    {session.subject}
                  </h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <User className="h-4 w-4" />
                    {session.tutor}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSelectedSession(session.id)}
                >
                  Book Session
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Available:</span>
                  <div className="flex gap-1 flex-wrap">
                    {session.available.map((time, idx) => (
                      <Badge key={idx} variant="secondary">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {session.topics.map((topic, idx) => (
                    <Badge key={idx} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedSession && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Booking request submitted! You'll receive a confirmation email shortly.
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedSession(null)}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}