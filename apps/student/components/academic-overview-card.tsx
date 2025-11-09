import { Card, CardHeader, CardTitle, CardDescription, CardContent, ProgressIndicator } from '@aah/ui';
import { GraduationCap } from 'lucide-react';

export interface AcademicOverviewCardProps {
  gpa: number;
  maxGpa?: number;
  creditsEarned: number;
  totalCredits: number;
  degreeProgress: number;
}

export function AcademicOverviewCard({
  gpa,
  maxGpa = 4.0,
  creditsEarned,
  totalCredits,
  degreeProgress,
}: AcademicOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Academic Overview</CardTitle>
            <CardDescription>Your current academic standing</CardDescription>
          </div>
          <GraduationCap className="h-8 w-8 text-brand-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium">Current GPA</span>
            <span className="text-2xl font-bold">{gpa.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">out of {maxGpa.toFixed(1)}</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium">Credits Earned</span>
            <span className="text-lg font-semibold">
              {creditsEarned} / {totalCredits}
            </span>
          </div>
          <ProgressIndicator
            value={creditsEarned}
            max={totalCredits}
            variant="linear"
            size="md"
            color="primary"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium">Degree Progress</span>
            <span className="text-lg font-semibold">{Math.round(degreeProgress)}%</span>
          </div>
          <ProgressIndicator
            value={degreeProgress}
            max={100}
            variant="linear"
            size="md"
            color="success"
          />
        </div>
      </CardContent>
    </Card>
  );
}