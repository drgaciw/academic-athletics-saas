# Demo Scripts for Video Walkthroughs

Scripts and guides for creating demonstration videos of the AI Evaluation Framework.

## Table of Contents

- [Demo 1: System Setup](#demo-1-system-setup)
- [Demo 2: Running Evaluations](#demo-2-running-evaluations)
- [Demo 3: Adding Test Cases](#demo-3-adding-test-cases)
- [Demo 4: Advanced Features](#demo-4-advanced-features)
- [Recording Guidelines](#recording-guidelines)
- [Visual Assets](#visual-assets)

---

## Demo 1: System Setup

**Duration**: 5-7 minutes
**Audience**: Developers and QA engineers
**Goal**: Show how to install and configure the evaluation framework

### Script

#### Introduction (30 seconds)

```
[SCREEN: Show AAH dashboard]

"Welcome to the AI Evaluation Framework for Athletic Academics Hub.
In this video, we'll walk through setting up the evaluation system
from scratch. By the end, you'll have a fully configured environment
ready to test our AI models."

[TRANSITION: Terminal window]
```

#### Step 1: Prerequisites Check (1 minute)

```
[SCREEN: Terminal]

"First, let's verify we have the required prerequisites."

[TYPE]
$ node --version
v18.17.0

$ pnpm --version
8.10.0

"Great! We have Node.js 18 and pnpm installed. If you see different
versions or errors, please install these first."

[DIAGRAM SLIDE: Architecture overview]
```

![Architecture Diagram Placeholder]
```
┌─────────────────────────────────────┐
│  AI Evaluation Framework            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Datasets │  │ Runners  │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Scorers  │  │Orchestr. │       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
```

#### Step 2: Installation (1.5 minutes)

```
[SCREEN: Terminal]

"Now let's install the framework. Navigate to your project root."

[TYPE]
$ cd /path/to/academic-athletics-saas
$ cd packages/ai-evals
$ pnpm install

[SHOW: Installation progress]
...
✓ Dependencies installed

"Installation complete! Now let's set up our environment variables."

[TYPE]
$ cp .env.example .env
$ code .env

[SCREEN: VS Code showing .env file]

"You'll need to add three key environment variables:
1. OPENAI_API_KEY - Your OpenAI API key
2. ANTHROPIC_API_KEY - Your Anthropic API key (optional)
3. DATABASE_URL - Your Vercel Postgres connection string"

[HIGHLIGHT each variable as mentioned]

[TYPE in .env]
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgres://...

"Save the file. Never commit API keys to version control!"

[SCREEN: Add callout showing .gitignore]
```

#### Step 3: Verification (1 minute)

```
[SCREEN: Terminal]

"Let's verify the installation."

[TYPE]
$ pnpm run build

[SHOW: Build process]
...
✓ Build complete

$ ai-evals --version
1.0.0

$ ai-evals --help

[SHOW: Help output with commands highlighted]

"Perfect! The framework is ready. Let's check available datasets."

[TYPE]
$ ai-evals dataset list

[SHOW: List of datasets]
Available datasets:
- compliance-eligibility (25 tests)
- conversational-ncaa-rules (15 tests)
- advising-course-recommendations (20 tests)
```

#### Step 4: First Test Run (2 minutes)

```
[SCREEN: Terminal]

"Now for the exciting part - our first evaluation!"

[TYPE]
$ ai-evals run --dataset compliance-eligibility --model gpt-4-turbo

[SHOW: Progress bar]
Running evaluation...
Progress: [=========>    ] 45/50 tests

"Watch as the framework executes each test case against GPT-4.
It's tracking latency, cost, and accuracy for each test."

[SHOW: Completion]
✅ Evaluation complete!
Accuracy: 94% (47/50 tests passed)
Avg Latency: 1,234ms
Total Cost: $0.0523

"Excellent! We got 94% accuracy. Let's view the detailed report."

[TYPE]
$ ai-evals report --latest

[SHOW: Report summary]
```

#### Conclusion (1 minute)

```
[SCREEN: Split screen - Terminal and Dashboard]

"That's it! You've successfully:
✓ Installed the AI Evaluation Framework
✓ Configured your environment
✓ Run your first evaluation
✓ Generated a report

In our next video, we'll dive deeper into running evaluations,
comparing models, and analyzing results."

[SCREEN: Show key takeaways slide]
```

**Key Takeaways:**
- Installation takes < 5 minutes
- Only 3 environment variables needed
- First evaluation runs immediately
- Built-in datasets included

---

## Demo 2: Running Evaluations

**Duration**: 8-10 minutes
**Audience**: QA engineers and developers
**Goal**: Demonstrate running evaluations and interpreting results

### Script

#### Introduction (30 seconds)

```
[SCREEN: Dashboard overview]

"Welcome back! In this video, we'll explore running evaluations
in depth. You'll learn how to:
- Run evaluations via CLI
- Compare multiple models
- Interpret evaluation reports
- Detect and analyze regressions"

[TRANSITION]
```

#### Part 1: CLI Evaluation (2 minutes)

```
[SCREEN: Terminal]

"Let's start with a basic evaluation run."

[TYPE]
$ ai-evals run --dataset compliance-eligibility

"This runs the default model configured in your settings.
Let's make it more specific."

[TYPE]
$ ai-evals run \
  --dataset compliance-eligibility \
  --dataset conversational-ncaa-rules \
  --model gpt-4-turbo \
  --parallel \
  --concurrency 10

[SHOW: Real-time progress]
Starting evaluation job...
Job ID: eval-20250108-001

Parallel execution enabled (10 concurrent)
Progress: [=======>      ] 35/75 tests
Completed: 35 | Failed: 2 | Remaining: 40
Est. time: 2m 15s

"Notice the parallel execution - we're running 10 tests simultaneously
to speed things up. This is perfect for large test suites."

[SHOW: Completion with summary]
✅ Evaluation complete!

Summary:
- Total: 75 tests
- Passed: 71 (94.7%)
- Failed: 4
- Duration: 3m 12s
- Cost: $0.0845
```

#### Part 2: Model Comparison (2.5 minutes)

```
[SCREEN: Terminal]

"Now let's compare multiple models side-by-side."

[TYPE]
$ ai-evals compare \
  --models gpt-4-turbo claude-sonnet-4 gpt-3.5-turbo \
  --dataset compliance-eligibility

[SHOW: Comparison running]
Comparing 3 models on 50 tests...

Model: gpt-4-turbo      [==========] 50/50
Model: claude-sonnet-4  [==========] 50/50
Model: gpt-3.5-turbo    [==========] 50/50

[SHOW: Comparison table]
Model Comparison Results:

Model              | Accuracy | Avg Latency | Total Cost | Win Rate
-------------------|----------|-------------|------------|----------
gpt-4-turbo        | 96.0%    |    1,234ms  |   $0.0523  |    64%
claude-sonnet-4    | 94.0%    |      987ms  |   $0.0412  |    26%
gpt-3.5-turbo      | 88.0%    |      756ms  |   $0.0089  |    10%

"This is powerful! We can see:
- GPT-4 Turbo: Highest accuracy but slowest and most expensive
- Claude Sonnet: Great balance of accuracy and speed
- GPT-3.5 Turbo: Fastest and cheapest but lower accuracy

The win rate shows how often each model had the best result
for individual test cases."

[SCREEN: Show detailed breakdown]
```

#### Part 3: Report Analysis (3 minutes)

```
[SCREEN: Dashboard - Report view]

"Let's analyze our results in the dashboard."

[NAVIGATE: Click on latest report]

"Here's the overview: 94.7% accuracy. Let's drill down into
the failures."

[CLICK: Filter by "Failed tests"]

[SHOW: Failed test list]
Failed Tests:
1. compliance-edge-001: GPA boundary case
2. compliance-edge-003: Credit hour edge case
3. conversational-004: Ambiguous policy question
4. conversational-009: Multi-part NCAA rule

"Each failure shows:
- Test ID and description
- Expected output
- Actual output
- Score breakdown
- Why it failed"

[CLICK: on compliance-edge-001]

[SHOW: Detailed test view with diff]

Expected:
{
  "eligible": false,
  "issues": ["GPA below 2.3 threshold"]
}

Actual:
{
  "eligible": true,  ← MISMATCH
  "issues": []
}

Score: 0.0 (Exact match failed)

"This is a critical issue - the model thought a student with
GPA 2.29 was eligible, when the threshold is 2.3. This is
exactly the kind of edge case we need to catch!"

[SCREEN: Category breakdown]
```

#### Part 4: Baseline Comparison (2 minutes)

```
[SCREEN: Terminal]

"Now let's compare against our production baseline."

[TYPE]
$ ai-evals run --baseline prod-v1.0

[SHOW: Run completing]

✅ Evaluation complete!
⚠️  Regressions detected!

Baseline Comparison:
- Accuracy: 94.7% (baseline: 96.0%) ↓ -1.3%
- Latency: 1,456ms (baseline: 1,234ms) ↑ +18%
- Regressions: 2 major, 1 minor

[SHOW: Regression details]
Critical Regressions:
1. compliance-gpa-validation
   Baseline: 100% → Current: 0%
   Severity: CRITICAL

Major Regressions:
1. conversational-response-time
   Baseline: 1,200ms → Current: 1,850ms
   Severity: MAJOR

"This tells us:
1. We have a CRITICAL regression in GPA validation
2. Our latency increased by 18%
3. These issues need to be fixed before deployment"

[SCREEN: Show action items]
```

#### Conclusion (1 minute)

```
[SCREEN: Summary slide]

"In this video, we covered:
✓ Running evaluations with multiple datasets
✓ Comparing models side-by-side
✓ Analyzing detailed reports
✓ Detecting regressions against baselines

Next up: We'll show you how to create and manage test datasets."

[END SCREEN]
```

---

## Demo 3: Adding Test Cases

**Duration**: 6-8 minutes
**Audience**: QA engineers and developers
**Goal**: Show how to create datasets and add test cases

### Script

#### Introduction (30 seconds)

```
[SCREEN: Show existing dataset browser]

"In this video, you'll learn how to create and manage test datasets.
We'll cover:
- Creating new datasets
- Adding test cases
- Validating datasets
- Best practices"
```

#### Part 1: Creating a Dataset (2 minutes)

```
[SCREEN: VS Code]

"Let's create a new dataset for NCAA GPA requirements."

[CREATE FILE: create-gpa-dataset.ts]

import { DatasetManager } from '@aah/ai-evals';
import { z } from 'zod';

// Define schemas
const GPAInputSchema = z.object({
  studentId: z.string(),
  gpa: z.number().min(0).max(4.0),
  coreCoursesGPA: z.number().min(0).max(4.0),
});

const GPAOutputSchema = z.object({
  meetsRequirement: z.boolean(),
  message: z.string(),
});

// Create dataset
const manager = new DatasetManager();
const dataset = await manager.createDataset({
  name: 'compliance-gpa-validation',
  description: 'Test cases for NCAA GPA requirements',
  schema: {
    input: GPAInputSchema,
    output: GPAOutputSchema,
  },
  version: '1.0.0',
});

"We've defined strict schemas using Zod. This ensures every test
case matches our expected structure."

[RUN: Execute script]
$ ts-node create-gpa-dataset.ts
✓ Dataset created: compliance-gpa-validation
```

#### Part 2: Adding Test Cases (2.5 minutes)

```
[SCREEN: Continue in VS Code]

"Now let's add test cases. We'll cover:
- Easy cases (baseline)
- Boundary cases (edge cases)
- Error cases"

[TYPE: Add test cases]

// Easy case: Well above requirement
await manager.addTestCase(dataset.id, {
  input: {
    studentId: 'STU001',
    gpa: 3.5,
    coreCoursesGPA: 3.4,
  },
  expected: {
    meetsRequirement: true,
    message: 'GPA requirements met',
  },
  metadata: {
    difficulty: 'easy',
    category: 'baseline',
    tags: ['passing', 'above-minimum'],
    createdAt: new Date(),
    source: 'synthetic',
    description: 'Student well above GPA minimum',
  },
});

// Boundary case: Exactly at threshold
await manager.addTestCase(dataset.id, {
  input: {
    studentId: 'STU002',
    gpa: 2.3,
    coreCoursesGPA: 2.3,
  },
  expected: {
    meetsRequirement: true,
    message: 'GPA requirements met',
  },
  metadata: {
    difficulty: 'medium',
    category: 'boundary',
    tags: ['edge-case', 'threshold'],
    createdAt: new Date(),
    source: 'edge-case',
    description: 'Student exactly at 2.3 threshold',
  },
});

// Edge case: Just below threshold
await manager.addTestCase(dataset.id, {
  input: {
    studentId: 'STU003',
    gpa: 2.299,
    coreCoursesGPA: 2.3,
  },
  expected: {
    meetsRequirement: false,
    message: 'GPA below 2.3 threshold',
  },
  metadata: {
    difficulty: 'hard',
    category: 'boundary',
    tags: ['edge-case', 'failing', 'threshold'],
    createdAt: new Date(),
    source: 'edge-case',
    description: 'GPA just below threshold - critical test',
  },
});

"Notice how we categorize by difficulty and add descriptive tags.
This helps with filtering and analysis later."
```

#### Part 3: Validation (1.5 minutes)

```
[SCREEN: Terminal]

"Let's validate our dataset."

[TYPE]
$ ai-evals dataset validate compliance-gpa-validation

[SHOW: Validation results]
Validating dataset 'compliance-gpa-validation'...

✓ Schema validation passed
✓ All test cases have unique IDs
✓ All required metadata present
✓ Input/output match schemas

⚠️  Warnings:
- Consider adding more hard difficulty tests
- Category distribution: 60% baseline, 30% boundary, 10% error
  Recommended: 40% baseline, 40% boundary, 20% error

Summary:
- Total tests: 25
- Valid: 25
- Warnings: 2
- Errors: 0

"Validation passed! The warnings suggest we should add more
hard tests and balance our categories better. Let's do that."
```

#### Part 4: Testing the Dataset (1.5 minutes)

```
[SCREEN: Terminal]

"Let's run our new dataset to make sure it works."

[TYPE]
$ ai-evals run --dataset compliance-gpa-validation

[SHOW: Execution]
Running 25 tests...
✓ STU001: Passed (1.0)
✓ STU002: Passed (1.0)
✗ STU003: Failed (0.0)

...

Results:
- Passed: 23/25 (92%)
- Failed: 2

"Good! Most tests pass. The failures show our edge cases are
working - they're catching issues with the model."

[SCREEN: Show failed test]

Failed Test: STU003
Input: { gpa: 2.299, ... }
Expected: { meetsRequirement: false, ... }
Actual: { meetsRequirement: true, ... }

"This confirms our model needs improvement on boundary cases."
```

#### Conclusion (30 seconds)

```
[SCREEN: Summary]

"You've learned how to:
✓ Create datasets with strict schemas
✓ Add test cases with proper metadata
✓ Validate dataset structure
✓ Test datasets against models

Best practices:
- Use descriptive IDs and metadata
- Include easy, medium, and hard cases
- Focus on edge cases and boundaries
- Validate before committing
```

---

## Demo 4: Advanced Features

**Duration**: 10-12 minutes
**Audience**: Advanced users
**Goal**: Showcase advanced functionality

### Script Outline

#### Segment 1: Custom Scorers (3 minutes)

- Show built-in scorers
- Create custom scorer
- Integrate with evaluation
- Compare scoring strategies

#### Segment 2: CI/CD Integration (3 minutes)

- Show GitHub Actions workflow
- Demonstrate PR checks
- Explain deployment blocking
- Show regression alerts

#### Segment 3: Performance Optimization (2 minutes)

- Parallel execution tuning
- Rate limiting configuration
- Cost optimization strategies
- Caching techniques

#### Segment 4: Monitoring and Alerts (2 minutes)

- Set up Slack notifications
- Configure email reports
- Dashboard metrics
- Trend analysis

## Recording Guidelines

### Technical Setup

**Screen Recording**:
- Resolution: 1920x1080 (1080p)
- Frame rate: 30 fps
- Software: OBS Studio or ScreenFlow
- Audio: Clear microphone (eliminate background noise)

**Terminal Settings**:
```bash
# Use large, readable font
Font: Menlo/Monaco/Consolas
Size: 18-20pt
Theme: Light background for better visibility

# Clear prompt
PS1='$ '

# Enable color output
export CLICOLOR=1
```

**Code Editor**:
- Font size: 16-18pt
- Theme: Light (better for video)
- Hide distractions (minimap, sidebar)
- Enable word wrap

### Presentation Tips

1. **Pacing**:
   - Speak slowly and clearly
   - Pause after important points
   - Allow time for viewers to read

2. **Visual Cues**:
   - Use cursor to highlight
   - Zoom in on important sections
   - Add text overlays for key points

3. **Error Handling**:
   - Pre-record or practice
   - Have contingency for errors
   - Edit out mistakes in post

4. **Transitions**:
   - Use fade between sections
   - Add chapter markers
   - Include progress indicators

## Visual Assets

### Diagrams to Include

1. **Architecture Diagram**
```
[Placeholder for architecture diagram]
- Show components
- Data flow
- Integration points
```

2. **Workflow Diagrams**
```
[Placeholder for workflow diagram]
- Dataset creation flow
- Evaluation execution flow
- Baseline comparison flow
```

3. **UI Screenshots**
```
[Placeholder for UI screenshots]
- Dashboard overview
- Report details
- Dataset browser
- Baseline management
```

### Callouts and Annotations

Use text overlays for:
- **Important commands**: Highlight syntax
- **Key metrics**: Point out significant numbers
- **Best practices**: Add tips
- **Warnings**: Highlight potential issues

### Example Annotation

```
┌─────────────────────────────────────┐
│ $ ai-evals run --dataset ...       │ ← Command being executed
├─────────────────────────────────────┤
│ Progress: [=====>    ] 50%          │ ← Real-time progress
│                                     │
│ Key Point: Parallel execution      │ ← Annotation
│ speeds up evaluation by 10x!       │
└─────────────────────────────────────┘
```

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
**Video Production Status**: Scripts ready for recording
