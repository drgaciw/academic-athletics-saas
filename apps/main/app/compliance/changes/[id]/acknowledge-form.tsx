'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aah/ui';
import { acknowledgeRegulationChange } from '../../actions';

export function AcknowledgeForm({ changeId }: { changeId: string }) {
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await acknowledgeRegulationChange(changeId, notes || undefined);
    setPending(false);
    if (!res.ok) {
      setMessage(res.error ?? 'Failed');
      return;
    }
    setMessage('Acknowledged.');
    setNotes('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Acknowledgement</CardTitle>
        <CardDescription>
          Record that your office has reviewed this feed change (audit trail).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Acknowledge'}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
