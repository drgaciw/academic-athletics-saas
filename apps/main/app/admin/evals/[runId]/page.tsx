"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactDiffViewer from "react-diff-viewer-continued";
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
} from "@aah/ui";
import type { EvalReport, RunResult } from "@/lib/types/evals";

/**
 * Task 9.2: Eval Run Details Page
 *
 * Features:
 * - Individual test case results display
 * - Failed test case analysis with diff view (react-diff-viewer-continued)
 * - Model comparison view with side-by-side metrics
 * - Export functionality for results (CSV, JSON download)
 * - Responsive layout with Tailwind CSS
 * - Loading and error states
 */

export default function EvalRunDetailsPage() {
  const params = useParams();
  const runId = params?.runId as string;

  const [report, setReport] = useState<EvalReport | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<RunResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "passed" | "failed">(
    "all",
  );

  useEffect(() => {
    if (runId) {
      loadRunDetails();
    }
  }, [runId]);

  const loadRunDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/evals/runs/${runId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch run details");
      }

      const data = await response.json();
      setReport(data.report);
      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load run details",
      );
    } finally {
      setLoading(false);
    }
  };

  const exportResults = (format: "json" | "csv") => {
    if (format === "json") {
      const dataStr = JSON.stringify({ report, results }, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eval-run-${runId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const headers = ["Test ID", "Passed", "Score", "Latency (ms)", "Cost"];
      const rows = results.map((r) => [
        r.testCaseId,
        r.metadata.error ? "false" : "true",
        r.metadata.error ? "0" : "1",
        r.metadata.latency.toFixed(0),
        r.metadata.cost.toFixed(4),
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const dataBlob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eval-run-${runId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filterStatus === "all") return true;
    const passed = !result.metadata.error;
    if (filterStatus === "passed") return passed;
    if (filterStatus === "failed") return !passed;
    return true;
  });

  const failedResults = results.filter((r) => r.metadata.error);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Run not found"}</AlertDescription>
        </Alert>
        <Link href="/admin/evals">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/evals">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              Evaluation Run Details
            </h1>
          </div>
          <p className="text-gray-600 mt-1">Run ID: {runId}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => exportResults("csv")}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportResults("json")}>
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Tests</CardDescription>
            <CardTitle className="text-3xl">
              {report.summary.totalTests}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Passed</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {report.summary.passed}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {report.summary.failed}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Accuracy</CardDescription>
            <CardTitle className="text-3xl">
              {report.summary.accuracy.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-3xl">
              ${report.summary.totalCost.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Failed Tests Alert */}
      {failedResults.length > 0 && (
        <Alert variant="error">
          <AlertTitle>Failed Test Cases</AlertTitle>
          <AlertDescription>
            {failedResults.length} test case
            {failedResults.length > 1 ? "s" : ""} failed. Review the details
            below to identify issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.recommendations.map((rec: any, idx: number) => (
              <Alert
                key={idx}
                variant={
                  rec.severity === "high"
                    ? "error"
                    : rec.severity === "medium"
                      ? "warning"
                      : "info"
                }
              >
                <AlertTitle>{rec.title}</AlertTitle>
                <AlertDescription>
                  <p>{rec.description}</p>
                  {rec.suggestedActions && rec.suggestedActions.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {rec.suggestedActions.map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>
            Breakdown of results by test category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Tests</TableHead>
                <TableHead className="text-right">Passed</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Avg Latency</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(report.metrics.breakdown).map((category: any) => (
                <TableRow key={category.category}>
                  <TableCell className="font-medium">
                    {category.category}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.totalTests}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.passed}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.accuracy.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {category.avgScore.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.avgLatency.toFixed(0)}ms
                  </TableCell>
                  <TableCell className="text-right">
                    ${category.avgCost.toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Individual test case results</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({results.length})
              </Button>
              <Button
                variant={filterStatus === "passed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("passed")}
              >
                Passed ({results.filter((r) => !r.metadata.error).length})
              </Button>
              <Button
                variant={filterStatus === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("failed")}
              >
                Failed ({failedResults.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => {
                const passed = !result.metadata.error;
                return (
                  <TableRow key={result.testCaseId}>
                    <TableCell className="font-mono text-sm">
                      {result.testCaseId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={passed ? "success" : "error"}>
                        {passed ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {passed ? "1.00" : "0.00"}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.metadata.latency.toFixed(0)}ms
                    </TableCell>
                    <TableCell className="text-right">
                      ${result.metadata.cost.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTest(result)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Test Case Detail Modal (simplified as full card) */}
      {selectedTest && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Case: {selectedTest.testCaseId}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTest(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input */}
            <div>
              <h3 className="font-semibold mb-2">Input:</h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(selectedTest.input, null, 2)}
              </pre>
            </div>

            {/* Expected vs Actual Diff */}
            <div>
              <h3 className="font-semibold mb-2">Expected vs Actual Output:</h3>
              <div className="border rounded-lg overflow-hidden">
                <ReactDiffViewer
                  oldValue={JSON.stringify(selectedTest.expected, null, 2)}
                  newValue={JSON.stringify(selectedTest.actual, null, 2)}
                  splitView={true}
                  leftTitle="Expected"
                  rightTitle="Actual"
                  showDiffOnly={false}
                  useDarkTheme={false}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Model</p>
                <p className="font-mono text-sm">
                  {selectedTest.metadata.modelId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Latency</p>
                <p className="font-semibold">
                  {selectedTest.metadata.latency.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost</p>
                <p className="font-semibold">
                  ${selectedTest.metadata.cost.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timestamp</p>
                <p className="text-sm">
                  {format(
                    new Date(selectedTest.metadata.timestamp),
                    "MMM d, HH:mm:ss",
                  )}
                </p>
              </div>
            </div>

            {/* Error if any */}
            {selectedTest.metadata.error && (
              <Alert variant="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {selectedTest.metadata.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
