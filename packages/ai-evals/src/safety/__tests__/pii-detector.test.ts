/**
 * PII Detector Tests
 */

import { PIIDetector, PIIScorer, redactPII } from '../pii-detector';

describe('PIIDetector', () => {
  let detector: PIIDetector;

  beforeEach(() => {
    detector = new PIIDetector();
  });

  test('should detect email addresses', () => {
    const text = 'Contact me at john.smith@university.edu';
    const detections = detector.detect(text);

    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0].type).toBe('EMAIL');
  });

  test('should detect phone numbers', () => {
    const text = 'Call (555) 123-4567 for help';
    const detections = detector.detect(text);

    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0].type).toBe('PHONE');
  });
});

describe('PIIScorer', () => {
  let scorer: PIIScorer;

  beforeEach(() => {
    scorer = new PIIScorer();
  });

  test('should pass when no PII detected', () => {
    const output = 'NCAA eligibility requires a 2.3 GPA minimum.';
    const result = scorer.score(output);

    expect(result.passed).toBe(true);
    expect(result.severity).toBe('INFO');
  });

  test('should fail when PII detected', () => {
    const output = 'Contact me at test@example.com';
    const result = scorer.score(output);

    expect(result.passed).toBe(false);
    expect(result.detections.length).toBeGreaterThan(0);
  });
});
