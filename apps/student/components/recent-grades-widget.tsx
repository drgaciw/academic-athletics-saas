import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@aah/ui';
import { GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface CourseGrade {
  id: string;
  courseName: string;
  courseCode: string;
  grade: string;
  credits: number;
  term: string;
  completedAt: Date;
}

export interface RecentGradesWidgetProps {
  grades: CourseGrade[];
  gpaTrend?: 'up' | 'down' | 'stable';
}

const gradeColors: Record<string, string> = {
  'A': 'bg-green-100 text-green-800 border-green-200',
  'A-': 'bg-green-100 text-green-800 border-green-200',
  'B+': 'bg-blue-100 text-blue-800 border-blue-200',
  'B': 'bg-blue-100 text-blue-800 border-blue-200',
  'B-': 'bg-blue-100 text-blue-800 border-blue-200',
  'C+': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'C-': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'D+': 'bg-orange-100 text-orange-800 border-orange-200',
  'D': 'bg-orange-100 text-orange-800 border-orange-200',
  'D-': 'bg-orange-100 text-orange-800 border-orange-200',
  'F': 'bg-red-100 text-red-800 border-red-200',
};

export function RecentGradesWidget({ grades, gpaTrend = 'stable' }: RecentGradesWidgetProps) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-600', label: 'GPA improving' },
    down: { icon: TrendingDown, color: 'text-red-600', label: 'GPA declining' },
    stable: { icon: Minus, color: 'text-gray-600', label: 'GPA stable' },
  };

  const trend = trendConfig[gpaTrend];
  const TrendIcon = trend.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>
              {grades.length === 0
                ? 'No grades posted yet'
                : `Last ${grades.length} completed course${grades.length > 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-5 w-5 ${trend.color}`} />
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {grades.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <GraduationCap className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium">No grades yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your grades will appear here once posted by instructors
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((course) => {
              const gradeColor = gradeColors[course.grade] || 'bg-gray-100 text-gray-800 border-gray-200';

              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{course.courseName}</h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {course.courseCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{course.term}</span>
                      <span>•</span>
                      <span>{course.credits} credit{course.credits > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 font-bold text-lg ${gradeColor}`}
                    >
                      {course.grade}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {grades.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GPA Trend</span>
              <div className="flex items-center gap-1">
                <TrendIcon className={`h-4 w-4 ${trend.color}`} />
                <span className={`font-medium ${trend.color}`}>{trend.label}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
