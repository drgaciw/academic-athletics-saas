/**
 * Adversarial Dataset Loader
 * 
 * Provides utilities to load and validate adversarial test datasets
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AdversarialDataset, AdversarialDatasetSchema } from '../../src/types';

/**
 * Load adversarial dataset from JSON file
 * 
 * @param name - Dataset name (prompt-injection, data-exfiltration, jailbreak)
 * @returns Validated adversarial dataset
 */
export function loadAdversarialDataset(name: string): AdversarialDataset {
  const filePath = join(__dirname, `${name}.json`);
  
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Validate against schema
    const validated = AdversarialDatasetSchema.parse(data);
    
    return validated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load adversarial dataset "${name}": ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load all adversarial datasets
 * 
 * @returns Object containing all adversarial datasets
 */
export function loadAllAdversarialDatasets(): Record<string, AdversarialDataset> {
  return {
    promptInjection: loadAdversarialDataset('prompt-injection'),
    dataExfiltration: loadAdversarialDataset('data-exfiltration'),
    jailbreak: loadAdversarialDataset('jailbreak'),
  };
}

/**
 * Get summary statistics for adversarial datasets
 */
export function getAdversarialDatasetStats() {
  const datasets = loadAllAdversarialDatasets();
  
  const stats = {
    totalDatasets: Object.keys(datasets).length,
    totalTests: 0,
    byAttackType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
  };
  
  for (const dataset of Object.values(datasets)) {
    stats.totalTests += dataset.testCases.length;
    
    for (const testCase of dataset.testCases) {
      // Count by attack type
      const attackType = testCase.attackType;
      stats.byAttackType[attackType] = (stats.byAttackType[attackType] || 0) + 1;
      
      // Count by severity
      const severity = testCase.severity;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      
      // Count by difficulty
      const difficulty = testCase.metadata.difficulty;
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
    }
  }
  
  return stats;
}

/**
 * Export dataset names for convenience
 */
export const ADVERSARIAL_DATASETS = {
  PROMPT_INJECTION: 'prompt-injection',
  DATA_EXFILTRATION: 'data-exfiltration',
  JAILBREAK: 'jailbreak',
} as const;
