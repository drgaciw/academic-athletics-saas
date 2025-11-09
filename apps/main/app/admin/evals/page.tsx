'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
} from '@aah/ui';
import type { EvalRunListItem, TrendDataPoint } from '@/lib/types/evals';

/**
 * Task 9.1: AI Evaluation Overview Dashboard
 *
 * Features:
 * - Recent eval runs with status and metrics
 * - Trend charts for accuracy over time (Recharts)
 * - Cost and latency metrics visualization
 * - Active regressions alert section
 * - Responsive design with Tailwind CSS
 * - Loading and error states
 */

export default function EvalsDashboardPage() {
  const [runs, setRuns] = useState<EvalRunListItem[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [runsRes, trendsRes] = await Promise.all([
        fetch('/api/evals/runs'),
        fetch('/api/evals/trends?days=30'),
      ]);

      if (!runsRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const runsData = await runsRes.json();
      const trendsData = await trendsRes.json();

      setRuns(runsData.runs);
      setTrends(trendsData.trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const activeRegressions = runs.filter((run) => run.hasRegressions);
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const avgAccuracy =
    completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => sum + run.accuracy, 0) / completedRuns.length
      : 0;
  const totalCost = completedRuns.reduce((sum, run) => sum + run.totalCost, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Evaluation Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor model performance, track regressions, and analyze trends
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/evals/datasets">
            <Button variant="outline">Manage Datasets</Button>
          </Link>
          <Link href="/admin/evals/baselines">
            <Button variant="outline">Manage Baselines</Button>
          </Link>
          <Button>Run New Evaluation</Button>
        </div>
      </div>

      {/* Active Regressions Alert */}
      {activeRegressions.length > 0 && (
        <Alert variant="error">
          <AlertTitle>Active Regressions Detected</AlertTitle>
          <AlertDescription>
            {activeRegressions.length} eval run{activeRegressions.length > 1 ? 's have' : ' has'}{' '}
            detected performance regressions.
            <ul className="mt-2 space-y-1">
              {activeRegressions.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/admin/evals/${run.id}`}
                    className="text-red-700 hover:underline font-medium"
                  >
                    {run.datasetName} - {run.regressionCount} regression
                    {run.regressionCount > 1 ? 's' : ''}
                  </Link>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Runs</CardDescription>
            <CardTitle className="text-3xl">{runs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {completedRuns.length} completed, {runs.length - completedRuns.length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Average Accuracy</CardDescription>
            <CardTitle className="text-3xl">{avgAccuracy.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Across {completedRuns.length} completed runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-3xl">${totalCost.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Last 30 days of evaluation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Regressions</CardDescription>
            <CardTitle className="text-3xl">{activeRegressions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {activeRegressions.length > 0 ? 'Requires attention' : 'All systems normal'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Trend</CardTitle>
            <CardDescription>Model accuracy over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Latency Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Trend</CardTitle>
            <CardDescription>Average response time over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Latency']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="avgLatency"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  name="Avg Latency (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Trend</CardTitle>
            <CardDescription>Daily evaluation costs over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  name="Cost (USD)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Pass Rate Trend</CardTitle>
            <CardDescription>Test pass rate over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Pass Rate']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Pass Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluation Runs</CardTitle>
          <CardDescription>Latest evaluation runs across all datasets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Pass Rate</TableHead>
                <TableHead className="text-right">Tests</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.datasetName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{run.modelId}</code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        run.status === 'completed'
                          ? 'success'
                          : run.status === 'failed'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {run.status}
                    </Badge>
                    {run.hasRegressions && (
                      <Badge variant="error" className="ml-2">
                        {run.regressionCount} regression{run.regressionCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {run.status === 'completed' ? `${run.accuracy.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {run.status === 'completed' ? `${run.passRate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">{run.totalTests}</TableCell>
                  <TableCell className="text-right">
                    {run.status === 'completed' ? `${run.avgLatency.toFixed(0)}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {run.status === 'completed' ? `$${run.totalCost.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(run.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/evals/${run.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
