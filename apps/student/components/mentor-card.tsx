'use client'

import { Card, CardHeader, CardTitle, CardContent, Button, Avatar } from '@aah/ui'
import { Mail, Phone, MessageSquare } from 'lucide-react'

export function MentorCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Mentor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <div className="h-full w-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-xl">
              JS
            </div>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Dr. Jane Smith</h3>
            <p className="text-sm text-gray-600">Academic Success Coach</p>
            <p className="text-sm text-gray-500 mt-1">
              Available Mon-Fri, 9am-5pm
            </p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}