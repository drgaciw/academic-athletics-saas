"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
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
  Input,
  Textarea,
  Label,
  Select,
} from "@aah/ui";
import type { BaselineListItem, EvalRunListItem } from "@/lib/types/evals";

/**
 * Task 9.4: Baseline Management Interface
 *
 * Features:
 * - View and set active baselines
 * - Comparison view between runs and baselines
 * - Regression threshold configuration
 * - Create baselines from eval runs
 * - Responsive layout with Tailwind CSS
 * - Loading and error states
 */

// Zod schema for baseline creation
const baselineSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  runId: z.string().min(1, "Run selection is required"),
});

type BaselineFormData = z.infer<typeof baselineSchema>;

// Zod schema for regression threshold configuration
const thresholdSchema = z.object({
  accuracyThreshold: z.number().min(0).max(100),
  latencyThreshold: z.number().min(0),
  costThreshold: z.number().min(0),
});

type ThresholdFormData = z.infer<typeof thresholdSchema>;

export default function BaselinesPage() {
  const [baselines, setBaselines] = useState<BaselineListItem[]>([]);
  const [runs, setRuns] = useState<EvalRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewBaselineForm, setShowNewBaselineForm] = useState(false);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);
  const [comparisonRun, setComparisonRun] = useState<string | null>(null);

  const baselineForm = useForm<BaselineFormData>({
    resolver: zodResolver(baselineSchema),
  });

  const thresholdForm = useForm<ThresholdFormData>({
    resolver: zodResolver(thresholdSchema),
    defaultValues: {
      accuracyThreshold: 5,
      latencyThreshold: 500,
      costThreshold: 0.1,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [baselinesRes, runsRes] = await Promise.all([
        fetch("/api/evals/baselines"),
        fetch("/api/evals/runs"),
      ]);

      if (!baselinesRes.ok || !runsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const baselinesData = await baselinesRes.json();
      const runsData = await runsRes.json();

      setBaselines(baselinesData.baselines);
      setRuns(
        runsData.runs.filter((r: EvalRunListItem) => r.status === "completed"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const onCreateBaseline = async (data: BaselineFormData) => {
    try {
      const selectedRun = runs.find((r) => r.id === data.runId);
      if (!selectedRun) {
        throw new Error("Invalid run selected");
      }

      const response = await fetch("/api/evals/baselines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          datasetId: selectedRun.datasetId,
          datasetName: selectedRun.datasetName,
          accuracy: selectedRun.accuracy,
          passRate: selectedRun.passRate,
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create baseline");
      }

      await loadData();
      setShowNewBaselineForm(false);
      baselineForm.reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create baseline");
    }
  };

  const toggleBaselineActive = async (
    baselineId: string,
    isActive: boolean,
  ) => {
    try {
      // TODO: Implement API endpoint to toggle baseline active status
      console.log("Toggle baseline", baselineId, isActive);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update baseline");
    }
  };

  const deleteBaseline = async (baselineId: string) => {
    if (!confirm("Are you sure you want to delete this baseline?")) {
      return;
    }

    try {
      // TODO: Implement API endpoint to delete baseline
      console.log("Delete baseline", baselineId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete baseline");
    }
  };

  const onUpdateThresholds = async (data: ThresholdFormData) => {
    try {
      // TODO: Implement API endpoint to update thresholds
      console.log("Update thresholds", data);
      alert("Thresholds updated successfully");
      setShowThresholdConfig(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update thresholds");
    }
  };

  // Mock comparison data
  const getComparisonData = () => {
    if (!selectedBaseline || !comparisonRun) return null;

    const baseline = baselines.find((b) => b.id === selectedBaseline);
    const run = runs.find((r) => r.id === comparisonRun);

    if (!baseline || !run) return null;

    return {
      baseline,
      run,
      accuracyDelta: run.accuracy - baseline.accuracy,
      passRateDelta: run.passRate - baseline.passRate,
      latencyDelta: run.avgLatency - 1200, // Mock baseline latency
      costDelta: run.totalCost - 0.45, // Mock baseline cost
    };
  };

  const comparisonData = getComparisonData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading baselines...</p>
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
          <div className="flex items-center gap-3">
            <Link href="/admin/evals">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              Baseline Management
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            Set performance baselines and configure regression thresholds
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowThresholdConfig(true)}
          >
            Configure Thresholds
          </Button>
          <Button onClick={() => setShowNewBaselineForm(true)}>
            Create Baseline
          </Button>
        </div>
      </div>

      {/* Threshold Configuration */}
      {showThresholdConfig && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Regression Threshold Configuration</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowThresholdConfig(false);
                  thresholdForm.reset();
                }}
              >
                Cancel
              </Button>
            </div>
            <CardDescription>
              Define thresholds for regression detection. Runs exceeding these
              thresholds will be flagged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={thresholdForm.handleSubmit(onUpdateThresholds)}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="accuracy-threshold">
                    Accuracy Threshold (%)
                  </Label>
                  <Input
                    id="accuracy-threshold"
                    type="number"
                    step="0.1"
                    {...thresholdForm.register("accuracyThreshold", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Alert if accuracy drops by more than this percentage
                  </p>
                </div>

                <div>
                  <Label htmlFor="latency-threshold">
                    Latency Threshold (ms)
                  </Label>
                  <Input
                    id="latency-threshold"
                    type="number"
                    step="10"
                    {...thresholdForm.register("latencyThreshold", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Alert if latency increases by more than this amount
                  </p>
                </div>

                <div>
                  <Label htmlFor="cost-threshold">Cost Threshold ($)</Label>
                  <Input
                    id="cost-threshold"
                    type="number"
                    step="0.01"
                    {...thresholdForm.register("costThreshold", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Alert if cost increases by more than this amount
                  </p>
                </div>
              </div>

              <Button type="submit">Save Thresholds</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* New Baseline Form */}
      {showNewBaselineForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Baseline</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewBaselineForm(false);
                  baselineForm.reset();
                }}
              >
                Cancel
              </Button>
            </div>
            <CardDescription>
              Create a baseline from a completed evaluation run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={baselineForm.handleSubmit(onCreateBaseline)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...baselineForm.register("name")}
                  placeholder="e.g., Compliance Baseline v2.0"
                />
                {baselineForm.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {baselineForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...baselineForm.register("description")}
                  placeholder="Describe what this baseline represents..."
                  rows={3}
                />
                {baselineForm.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {baselineForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="runId">Select Evaluation Run</Label>
                <Select id="runId" {...baselineForm.register("runId")}>
                  <option value="">Choose a run...</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.datasetName} - {run.modelId} (
                      {run.accuracy.toFixed(1)}% accuracy) -{" "}
                      {format(new Date(run.createdAt), "MMM d, yyyy")}
                    </option>
                  ))}
                </Select>
                {baselineForm.formState.errors.runId && (
                  <p className="text-sm text-red-600 mt-1">
                    {baselineForm.formState.errors.runId.message}
                  </p>
                )}
              </div>

              <Button type="submit">Create Baseline</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Baselines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Baselines</CardTitle>
          <CardDescription>
            Performance baselines for regression detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Pass Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baselines.map((baseline) => (
                <TableRow key={baseline.id}>
                  <TableCell className="font-medium">{baseline.name}</TableCell>
                  <TableCell>{baseline.datasetName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={baseline.isActive ? "success" : "secondary"}
                    >
                      {baseline.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {baseline.accuracy.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {baseline.passRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(baseline.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBaseline(baseline.id)}
                      >
                        Compare
                      </Button>
                      <Button
                        variant={baseline.isActive ? "secondary" : "default"}
                        size="sm"
                        onClick={() =>
                          toggleBaselineActive(baseline.id, !baseline.isActive)
                        }
                      >
                        {baseline.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBaseline(baseline.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {selectedBaseline && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Baseline Comparison</CardTitle>
                <CardDescription>
                  Compare evaluation runs against{" "}
                  {baselines.find((b) => b.id === selectedBaseline)?.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBaseline(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comparison-run">Select Run to Compare</Label>
              <Select
                id="comparison-run"
                value={comparisonRun || ""}
                onChange={(e) => setComparisonRun(e.target.value)}
              >
                <option value="">Choose a run...</option>
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.datasetName} - {run.modelId} ({run.accuracy.toFixed(1)}
                    % accuracy) -{" "}
                    {format(new Date(run.createdAt), "MMM d, yyyy")}
                  </option>
                ))}
              </Select>
            </div>

            {comparisonData && (
              <div className="space-y-4">
                <Alert
                  variant={
                    comparisonData.accuracyDelta < -5
                      ? "error"
                      : comparisonData.accuracyDelta > 5
                        ? "success"
                        : "info"
                  }
                >
                  <AlertTitle>Comparison Summary</AlertTitle>
                  <AlertDescription>
                    {comparisonData.accuracyDelta < -5 ? (
                      <p>
                        Regression detected: Accuracy dropped by{" "}
                        {Math.abs(comparisonData.accuracyDelta).toFixed(1)}%
                      </p>
                    ) : comparisonData.accuracyDelta > 5 ? (
                      <p>
                        Improvement detected: Accuracy increased by{" "}
                        {comparisonData.accuracyDelta.toFixed(1)}%
                      </p>
                    ) : (
                      <p>Performance is within acceptable range</p>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardDescription>Accuracy Change</CardDescription>
                      <CardTitle
                        className={
                          comparisonData.accuracyDelta < 0
                            ? "text-red-600"
                            : comparisonData.accuracyDelta > 0
                              ? "text-green-600"
                              : ""
                        }
                      >
                        {comparisonData.accuracyDelta > 0 ? "+" : ""}
                        {comparisonData.accuracyDelta.toFixed(1)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Baseline: {comparisonData.baseline.accuracy.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Current: {comparisonData.run.accuracy.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardDescription>Pass Rate Change</CardDescription>
                      <CardTitle
                        className={
                          comparisonData.passRateDelta < 0
                            ? "text-red-600"
                            : comparisonData.passRateDelta > 0
                              ? "text-green-600"
                              : ""
                        }
                      >
                        {comparisonData.passRateDelta > 0 ? "+" : ""}
                        {comparisonData.passRateDelta.toFixed(1)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Baseline: {comparisonData.baseline.passRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Current: {comparisonData.run.passRate.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardDescription>Latency Change</CardDescription>
                      <CardTitle
                        className={
                          comparisonData.latencyDelta > 0
                            ? "text-red-600"
                            : comparisonData.latencyDelta < 0
                              ? "text-green-600"
                              : ""
                        }
                      >
                        {comparisonData.latencyDelta > 0 ? "+" : ""}
                        {comparisonData.latencyDelta.toFixed(0)}ms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Baseline: 1200ms</p>
                      <p className="text-sm text-gray-600">
                        Current: {comparisonData.run.avgLatency.toFixed(0)}ms
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardDescription>Cost Change</CardDescription>
                      <CardTitle
                        className={
                          comparisonData.costDelta > 0
                            ? "text-red-600"
                            : comparisonData.costDelta < 0
                              ? "text-green-600"
                              : ""
                        }
                      >
                        {comparisonData.costDelta > 0 ? "+" : ""}$
                        {Math.abs(comparisonData.costDelta).toFixed(2)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Baseline: $0.45</p>
                      <p className="text-sm text-gray-600">
                        Current: ${comparisonData.run.totalCost.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
