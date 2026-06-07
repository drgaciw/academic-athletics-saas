import * as fs from 'fs'
import * as path from 'path'

const datasetsRoot = path.join(__dirname, '../../datasets')

function listJsonFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(full)
    }
  }
  return files
}

function isAdversarialDataset(filePath: string, data: Record<string, unknown>): boolean {
  return filePath.includes(`${path.sep}adversarial${path.sep}`) || Array.isArray(data.testCases)
    ? (data.testCases as unknown[]).some(
        (tc) => typeof tc === 'object' && tc !== null && 'attackType' in (tc as object)
      )
    : false
}

describe('ai-evals dataset validation (G5)', () => {
  const jsonFiles = listJsonFiles(datasetsRoot)

  it('discovers dataset JSON files', () => {
    expect(jsonFiles.length).toBeGreaterThan(0)
  })

  it.each(jsonFiles.map((f) => [path.relative(datasetsRoot, f), f] as const))(
    '%s parses and matches minimal schema',
    (_rel, filePath) => {
      const raw = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(raw) as Record<string, unknown>

      expect(typeof data.id === 'string' || typeof data.name === 'string').toBe(true)

      if (Array.isArray(data.testCases)) {
        for (const tc of data.testCases) {
          const row = tc as Record<string, unknown>
          expect(row.id).toEqual(expect.any(String))
          const hasInput =
            typeof row.input === 'string' ||
            (typeof row.input === 'object' && row.input !== null) ||
            typeof row.message === 'string' ||
            typeof row.query === 'string'
          expect(hasInput).toBe(true)
          const hasExpected =
            row.expected !== undefined ||
            row.expectedBehavior !== undefined ||
            row.expectedOutput !== undefined
          expect(hasExpected).toBe(true)
        }
      }

      if (isAdversarialDataset(filePath, data)) {
        const types = new Set(
          (data.testCases as Array<{ attackType?: string }>).map((tc) => tc.attackType).filter(Boolean)
        )
        expect(types.size).toBeGreaterThan(0)
      }
    }
  )
})
