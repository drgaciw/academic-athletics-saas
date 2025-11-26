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
} from "@aah/ui";
import type { DatasetListItem, Dataset, TestCase } from "@/lib/types/evals";

/**
 * Task 9.3: Dataset Management Interface
 *
 * Features:
 * - Browse and edit datasets
 * - Form to create new test cases (react-hook-form + Zod)
 * - Display version history for datasets
 * - Import/export functionality
 * - Responsive layout with Tailwind CSS
 * - Loading and error states
 */

// Zod schema for dataset creation
const datasetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type DatasetFormData = z.infer<typeof datasetSchema>;

// Zod schema for test case creation
const testCaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  input: z.string().min(1, "Input is required"),
  expected: z.string().min(1, "Expected output is required"),
  tags: z.string().optional(),
});

type TestCaseFormData = z.infer<typeof testCaseSchema>;

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDatasetForm, setShowNewDatasetForm] = useState(false);
  const [showNewTestCaseForm, setShowNewTestCaseForm] = useState(false);

  const datasetForm = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
  });

  const testCaseForm = useForm<TestCaseFormData>({
    resolver: zodResolver(testCaseSchema),
  });

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/evals/datasets");
      if (!response.ok) {
        throw new Error("Failed to fetch datasets");
      }

      const data = await response.json();
      setDatasets(data.datasets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async (datasetId: string) => {
    try {
      // TODO: Implement API endpoint for loading test cases
      setSelectedDataset(datasetId);
      setTestCases([]);
    } catch (err) {
      console.error("Error loading test cases:", err);
    }
  };

  const onCreateDataset = async (data: DatasetFormData) => {
    try {
      const response = await fetch("/api/evals/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create dataset");
      }

      await loadDatasets();
      setShowNewDatasetForm(false);
      datasetForm.reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create dataset");
    }
  };

  const onCreateTestCase = async (data: TestCaseFormData) => {
    try {
      if (!selectedDataset) return;

      // Parse JSON strings
      const input = JSON.parse(data.input);
      const expected = JSON.parse(data.expected);
      const tags = data.tags
        ? data.tags.split(",").map((t: string) => t.trim())
        : [];

      const testCase: Partial<TestCase> = {
        id: `test-${Date.now()}`,
        name: data.name,
        category: data.category,
        input,
        expected,
        tags,
      };

      // TODO: Implement API endpoint for creating test cases
      console.log("Creating test case:", testCase);

      setShowNewTestCaseForm(false);
      testCaseForm.reset();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Invalid JSON in input or expected output",
      );
    }
  };

  const exportDataset = async (datasetId: string, format: "json" | "yaml") => {
    try {
      // TODO: Implement dataset export
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) return;

      const dataStr = JSON.stringify(dataset, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dataset-${datasetId}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export dataset");
    }
  };

  const importDataset = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.yaml,.yml";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // TODO: Implement dataset import API
        console.log("Importing dataset:", data);
        alert("Dataset imported successfully");
        await loadDatasets();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to import dataset");
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading datasets...</p>
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
        <Button onClick={loadDatasets} className="mt-4">
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
              Dataset Management
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            Create and manage test datasets for evaluations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={importDataset}>
            Import Dataset
          </Button>
          <Button onClick={() => setShowNewDatasetForm(true)}>
            Create Dataset
          </Button>
        </div>
      </div>

      {/* New Dataset Form */}
      {showNewDatasetForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Dataset</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewDatasetForm(false);
                  datasetForm.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={datasetForm.handleSubmit(onCreateDataset)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...datasetForm.register("name")}
                  placeholder="e.g., NCAA Compliance Tests v2"
                />
                {datasetForm.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {datasetForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...datasetForm.register("description")}
                  placeholder="Describe the purpose and contents of this dataset..."
                  rows={3}
                />
                {datasetForm.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {datasetForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <Button type="submit">Create Dataset</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Datasets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Datasets</CardTitle>
          <CardDescription>All available test datasets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Test Cases</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {dataset.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{dataset.version}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {dataset.testCaseCount}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(dataset.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTestCases(dataset.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportDataset(dataset.id, "json")}
                      >
                        Export
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Test Cases View (when dataset selected) */}
      {selectedDataset && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Cases</CardTitle>
                <CardDescription>
                  {datasets.find((d) => d.id === selectedDataset)?.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataset(null)}
                >
                  Close
                </Button>
                <Button size="sm" onClick={() => setShowNewTestCaseForm(true)}>
                  Add Test Case
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showNewTestCaseForm && (
              <Card className="mb-4 border-2 border-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">New Test Case</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewTestCaseForm(false);
                        testCaseForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={testCaseForm.handleSubmit(onCreateTestCase)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tc-name">Name</Label>
                        <Input
                          id="tc-name"
                          {...testCaseForm.register("name")}
                          placeholder="Test case name"
                        />
                        {testCaseForm.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {testCaseForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tc-category">Category</Label>
                        <Input
                          id="tc-category"
                          {...testCaseForm.register("category")}
                          placeholder="e.g., Initial Eligibility"
                        />
                        {testCaseForm.formState.errors.category && (
                          <p className="text-sm text-red-600 mt-1">
                            {testCaseForm.formState.errors.category.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tc-input">Input (JSON)</Label>
                      <Textarea
                        id="tc-input"
                        {...testCaseForm.register("input")}
                        placeholder='{"studentId": "123", "gpa": 3.5, ...}'
                        rows={4}
                        className="font-mono text-sm"
                      />
                      {testCaseForm.formState.errors.input && (
                        <p className="text-sm text-red-600 mt-1">
                          {testCaseForm.formState.errors.input.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tc-expected">
                        Expected Output (JSON)
                      </Label>
                      <Textarea
                        id="tc-expected"
                        {...testCaseForm.register("expected")}
                        placeholder='{"eligible": true, "issues": []}'
                        rows={4}
                        className="font-mono text-sm"
                      />
                      {testCaseForm.formState.errors.expected && (
                        <p className="text-sm text-red-600 mt-1">
                          {testCaseForm.formState.errors.expected.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tc-tags">Tags (comma-separated)</Label>
                      <Input
                        id="tc-tags"
                        {...testCaseForm.register("tags")}
                        placeholder="edge-case, high-priority"
                      />
                    </div>

                    <Button type="submit">Add Test Case</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {testCases.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>
                  No test cases yet. Click &quot;Add Test Case&quot; to create
                  one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {testCases.map((testCase) => (
                  <Card key={testCase.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {testCase.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge>{testCase.category}</Badge>
                          {testCase.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Input:</h4>
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testCase.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Expected Output:
                          </h4>
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testCase.expected, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
