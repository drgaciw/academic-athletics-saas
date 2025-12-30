import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@aah/ui/components/card';
import { Badge } from '@aah/ui/components/badge';
import { Button } from '@aah/ui/components/button';
import { ProgressIndicator } from '@aah/ui/components/progress-indicator';
import { Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export interface TransferEligibilityDashboardProps {
  eligibilityStatus: 'Eligible' | 'Conditional' | 'Ineligible';
  cumulativeGpa: number; // NCAA calculated
  totalCreditsTaken: number;
  transferableCredits: number;
  bylawsApplied: {
    rule: string;
    description: string;
    citation: string;
    met: boolean;
  }[];
  onExportPdf?: () => void;
}

export function TransferEligibilityDashboard({
  eligibilityStatus,
  cumulativeGpa,
  totalCreditsTaken,
  transferableCredits,
  bylawsApplied,
  onExportPdf,
}: TransferEligibilityDashboardProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Eligible': return 'success';
      case 'Conditional': return 'warning';
      case 'Ineligible': return 'error';
      default: return 'default';
    }
  };

  const statusColor = getStatusColor(eligibilityStatus);
  const creditPercentage = Math.min((transferableCredits / totalCreditsTaken) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transfer Eligibility</h2>
        <Button onClick={onExportPdf} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. ELIGIBILITY STATUS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {eligibilityStatus === 'Eligible' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
             eligibilityStatus === 'Conditional' ? <AlertCircle className="h-4 w-4 text-yellow-500" /> :
             <XCircle className="h-4 w-4 text-red-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Badge variant={statusColor as any} className="w-fit text-lg px-3 py-1">
                {eligibilityStatus}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Based on 6/18/24 rule assessment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. GPA PROGRESS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCAA GPA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <div className="relative">
              <ProgressIndicator
                value={(cumulativeGpa / 4.0) * 100}
                variant="circular"
                size="md"
                color={cumulativeGpa >= 2.0 ? 'success' : 'error'}
              />
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {cumulativeGpa.toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Min 2.0 required
            </p>
          </CardContent>
        </Card>

        {/* 3. CREDIT BREAKDOWN */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Credit Breakdown</CardTitle>
            <CardDescription>Total Taken vs. Transferable (Grades ≥ C)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Taken</span>
                  <span className="font-medium">{totalCreditsTaken}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transferable</span>
                  <span className="font-medium">{transferableCredits}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${creditPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. BYLAW CITATIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Applied NCAA Bylaws (Article 14)</CardTitle>
          <CardDescription>Specific rules applied to your transfer record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bylawsApplied.map((bylaw, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                <div className="mt-0.5">
                  {bylaw.met ?
                    <CheckCircle2 className="h-5 w-5 text-success" /> :
                    <XCircle className="h-5 w-5 text-destructive" />
                  }
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm leading-none">
                    {bylaw.rule} <span className="text-muted-foreground font-normal ml-2">({bylaw.citation})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bylaw.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
