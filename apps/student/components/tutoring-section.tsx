"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@aah/ui";
import { Clock, User, BookOpen } from "lucide-react";
import { apiPath } from "@/lib/api-path";

interface TutoringSectionProps {
  studentProfileId: string;
}

interface TutorAvailability {
  tutorId: string;
  tutorName: string;
  subject: string;
  availableSlots: Array<{ startTime: string; endTime: string; isAvailable: boolean }>;
}

export function TutoringSection({ studentProfileId }: TutoringSectionProps) {
  const [tutors, setTutors] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      setError(null);

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({ startDate, endDate });

      try {
        const response = await fetch(apiPath(`/api/support/tutoring/availability?${params}`));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message ?? "Failed to load tutoring availability");
        }

        setTutors(data.availability ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tutoring availability");
      } finally {
        setLoading(false);
      }
    }

    void loadAvailability();
  }, []);

  async function handleBook(tutor: TutorAvailability) {
    const slot = tutor.availableSlots.find((entry) => entry.isAvailable);
    if (!slot) return;

    setBooking(true);
    setError(null);

    try {
      const response = await fetch(apiPath("/api/support/tutoring/book"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentProfileId,
          tutorId: tutor.tutorId,
          subject: tutor.subject,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to book tutoring session");
      }

      setSelectedSession(tutor.tutorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book tutoring session");
    } finally {
      setBooking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutoring Services</CardTitle>
        <CardDescription>
          Book one-on-one tutoring sessions with peer tutors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading tutor availability...</p>
        )}

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {!loading && tutors.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            No tutors are available in the next two weeks. Check back soon.
          </p>
        )}

        <div className="space-y-4">
          {tutors.map((session) => {
            const availableSlots = session.availableSlots.filter((slot) => slot.isAvailable);

            return (
              <div
                key={session.tutorId}
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
                      {session.tutorName}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={availableSlots.length === 0 || booking}
                    onClick={() => void handleBook(session)}
                  >
                    Book Session
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Available:</span>
                    <div className="flex gap-1 flex-wrap">
                      {availableSlots.slice(0, 3).map((slot, idx) => (
                        <Badge key={idx} variant="secondary">
                          {new Date(slot.startTime).toLocaleString(undefined, {
                            weekday: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Badge>
                      ))}
                      {availableSlots.length === 0 && (
                        <span className="text-muted-foreground">No open slots</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedSession && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Booking request submitted. You&apos;ll receive a confirmation email shortly.
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
  );
}
