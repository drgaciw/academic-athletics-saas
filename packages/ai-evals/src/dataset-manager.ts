/**
 * Dataset Manager
 * 
 * Manages test datasets with CRUD operations, versioning, and validation
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'
import type { Dataset, TestCase } from './types'

/**
 * Zod schemas for validation
 */
const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.string(),
  expected: z.any(),
  category: z.string(),
  difficulty: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
  metadata: z.object({
    source: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    author: z.string().optional(),
  }).optional(),
})

const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  testCases: z.array(TestCaseSchema),
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Dataset Manager Class
 */
export class DatasetManager {
  private datasetsDir: string

  constructor(datasetsDir: string = join(process.cwd(), 'datasets')) {
    this.datasetsDir = datasetsDir
  }

  /**
   * Initialize datasets directory
   */
  async initialize(): Promise<void> {
    try {
      await mkdir(this.datasetsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Create a new dataset
   */
  async createDataset(dataset: Omit<Dataset, 'metadata'>): Promise<Dataset> {
    await this.initialize()

    const fullDataset: Dataset = {
      ...dataset,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    // Validate dataset
    this.validateDataset(fullDataset)

    // Save to file
    const filePath = this.getDatasetPath(dataset.id)
    await writeFile(filePath, JSON.stringify(fullDataset, null, 2), 'utf-8')

    return fullDataset
  }

  /**
   * Load a dataset by ID
   */
  async loadDataset(datasetId: string): Promise<Dataset> {
    const filePath = this.getDatasetPath(datasetId)
    
    try {
      const content = await readFile(filePath, 'utf-8')
      const dataset = JSON.parse(content)
      
      // Validate dataset
      this.validateDataset(dataset)
      
      return dataset
    } catch (error) {
      throw new Error(`Failed to load dataset ${datasetId}: ${error}`)
    }
  }

  /**
   * List all datasets
   */
  async listDatasets(): Promise<Array<{ id: string; name: string; version: string }>> {
    await this.initialize()

    try {
      const files = await readdir(this.datasetsDir)
      const datasets = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const datasetId = file.replace('.json', '')
          const dataset = await this.loadDataset(datasetId)
          datasets.push({
            id: dataset.id,
            name: dataset.name,
            version: dataset.version,
          })
        }
      }

      return datasets
    } catch (error) {
      return []
    }
  }

  /**
   * Update a dataset
   */
  async updateDataset(datasetId: string, updates: Partial<Dataset>): Promise<Dataset> {
    const dataset = await this.loadDataset(datasetId)

    const updatedDataset: Dataset = {
      ...dataset,
      ...updates,
      metadata: {
        ...dataset.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Validate updated dataset
    this.validateDataset(updatedDataset)

    // Save to file
    const filePath = this.getDatasetPath(datasetId)
    await writeFile(filePath, JSON.stringify(updatedDataset, null, 2), 'utf-8')

    return updatedDataset
  }

  /**
   * Delete a dataset
   */
  async deleteDataset(datasetId: string): Promise<void> {
    const filePath = this.getDatasetPath(datasetId)
    const { unlink } = await import('fs/promises')
    await unlink(filePath)
  }

  /**
   * Add a test case to a dataset
   */
  async addTestCase(datasetId: string, testCase: TestCase): Promise<Dataset> {
    const dataset = await this.loadDataset(datasetId)

    // Check for duplicate ID
    if (dataset.testCases.some(tc => tc.id === testCase.id)) {
      throw new Error(`Test case with ID ${testCase.id} already exists`)
    }

    dataset.testCases.push(testCase)
    
    return this.updateDataset(datasetId, dataset)
  }

  /**
   * Remove a test case from a dataset
   */
  async removeTestCase(datasetId: string, testCaseId: string): Promise<Dataset> {
    const dataset = await this.loadDataset(datasetId)

    dataset.testCases = dataset.testCases.filter(tc => tc.id !== testCaseId)
    
    return this.updateDataset(datasetId, dataset)
  }

  /**
   * Update a test case in a dataset
   */
  async updateTestCase(
    datasetId: string,
    testCaseId: string,
    updates: Partial<TestCase>
  ): Promise<Dataset> {
    const dataset = await this.loadDataset(datasetId)

    const index = dataset.testCases.findIndex(tc => tc.id === testCaseId)
    if (index === -1) {
      throw new Error(`Test case ${testCaseId} not found`)
    }

    dataset.testCases[index] = {
      ...dataset.testCases[index],
      ...updates,
    }
    
    return this.updateDataset(datasetId, dataset)
  }

  /**
   * Filter test cases by criteria
   */
  async filterTestCases(
    datasetId: string,
    filters: {
      category?: string
      tags?: string[]
      difficulty?: number
    }
  ): Promise<TestCase[]> {
    const dataset = await this.loadDataset(datasetId)

    return dataset.testCases.filter(tc => {
      if (filters.category && tc.category !== filters.category) {
        return false
      }

      if (filters.tags && !filters.tags.some(tag => tc.tags?.includes(tag))) {
        return false
      }

      if (filters.difficulty && tc.difficulty !== filters.difficulty) {
        return false
      }

      return true
    })
  }

  /**
   * Validate dataset structure
   */
  validateDataset(dataset: Dataset): void {
    try {
      DatasetSchema.parse(dataset)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Dataset validation failed: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }

  /**
   * Get dataset file path
   */
  private getDatasetPath(datasetId: string): string {
    return join(this.datasetsDir, `${datasetId}.json`)
  }

  /**
   * Create dataset from array of test cases
   */
  async createFromTestCases(
    id: string,
    name: string,
    description: string,
    testCases: TestCase[]
  ): Promise<Dataset> {
    return this.createDataset({
      id,
      name,
      description,
      version: '1.0.0',
      testCases,
    })
  }

  /**
   * Merge multiple datasets
   */
  async mergeDatasets(
    datasetIds: string[],
    newId: string,
    newName: string
  ): Promise<Dataset> {
    const datasets = await Promise.all(
      datasetIds.map(id => this.loadDataset(id))
    )

    const allTestCases: TestCase[] = []
    const seenIds = new Set<string>()

    for (const dataset of datasets) {
      for (const testCase of dataset.testCases) {
        if (!seenIds.has(testCase.id)) {
          allTestCases.push(testCase)
          seenIds.add(testCase.id)
        }
      }
    }

    return this.createDataset({
      id: newId,
      name: newName,
      description: `Merged dataset from: ${datasets.map(d => d.name).join(', ')}`,
      version: '1.0.0',
      testCases: allTestCases,
    })
  }

  /**
   * Get dataset statistics
   */
  async getStatistics(datasetId: string): Promise<{
    totalTestCases: number
    byCategory: Record<string, number>
    byDifficulty: Record<number, number>
    averageDifficulty: number
  }> {
    const dataset = await this.loadDataset(datasetId)

    const byCategory: Record<string, number> = {}
    const byDifficulty: Record<number, number> = {}
    let totalDifficulty = 0
    let countWithDifficulty = 0

    for (const testCase of dataset.testCases) {
      // Count by category
      byCategory[testCase.category] = (byCategory[testCase.category] || 0) + 1

      // Count by difficulty
      if (testCase.difficulty) {
        byDifficulty[testCase.difficulty] = (byDifficulty[testCase.difficulty] || 0) + 1
        totalDifficulty += testCase.difficulty
        countWithDifficulty++
      }
    }

    return {
      totalTestCases: dataset.testCases.length,
      byCategory,
      byDifficulty,
      averageDifficulty: countWithDifficulty > 0 ? totalDifficulty / countWithDifficulty : 0,
    }
  }
}

/**
 * Global dataset manager instance
 */
export const globalDatasetManager = new DatasetManager()

/**
 * Convenience functions
 */
export async function createDataset(dataset: Omit<Dataset, 'metadata'>): Promise<Dataset> {
  return globalDatasetManager.createDataset(dataset)
}

export async function loadDataset(datasetId: string): Promise<Dataset> {
  return globalDatasetManager.loadDataset(datasetId)
}

export async function listDatasets(): Promise<Array<{ id: string; name: string; version: string }>> {
  return globalDatasetManager.listDatasets()
}

export async function addTestCase(datasetId: string, testCase: TestCase): Promise<Dataset> {
  return globalDatasetManager.addTestCase(datasetId, testCase)
}
