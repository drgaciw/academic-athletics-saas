import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { table } from 'table';
import boxen from 'boxen';
import figlet from 'figlet';
import { format } from 'date-fns';

/**
 * Display ASCII art banner
 */
export function displayBanner(): void {
  const banner = figlet.textSync('AI Evals', {
    font: 'Standard',
    horizontalLayout: 'default',
  });

  console.log(chalk.cyan(banner));
  console.log(
    chalk.gray(
      '  Athletic Academics Hub - AI Evaluation Framework\n'
    )
  );
}

/**
 * Display a success message
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Display an error message
 */
export function error(message: string): void {
  console.log(chalk.red('✗'), message);
}

/**
 * Display a warning message
 */
export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Display an info message
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Display a section header
 */
export function section(title: string): void {
  console.log('\n' + chalk.bold.underline(title) + '\n');
}

/**
 * Create a spinner with message
 */
export function spinner(message: string): Ora {
  return ora({
    text: message,
    color: 'cyan',
  }).start();
}

/**
 * Display a boxed message
 */
export function box(message: string, title?: string): void {
  console.log(
    boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title,
      titleAlignment: 'center',
    })
  );
}

/**
 * Format a table for display
 */
export function formatTable(data: string[][], config?: any): string {
  return table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼',
    },
    ...config,
  });
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format a duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Format a cost in USD
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format a timestamp
 */
export function formatTimestamp(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Color-code a score
 */
export function colorScore(score: number, threshold = 0.8): string {
  const percent = formatPercent(score);
  if (score >= threshold) {
    return chalk.green(percent);
  }
  if (score >= threshold * 0.7) {
    return chalk.yellow(percent);
  }
  return chalk.red(percent);
}

/**
 * Color-code a pass/fail status
 */
export function colorStatus(passed: boolean): string {
  return passed ? chalk.green('PASS') : chalk.red('FAIL');
}

/**
 * Display progress summary
 */
export function displayProgress(
  current: number,
  total: number,
  label = 'Progress'
): void {
  const percent = (current / total) * 100;
  const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
  console.log(`${label}: [${bar}] ${current}/${total} (${percent.toFixed(1)}%)`);
}

/**
 * Confirm action with user
 */
export function confirmAction(message: string): boolean {
  // This is a placeholder - actual implementation uses inquirer
  return true;
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length - 3) + '...';
}

/**
 * Display a divider
 */
export function divider(char = '─', length = 80): void {
  console.log(chalk.gray(char.repeat(length)));
}

/**
 * Format JSON with syntax highlighting
 */
export function formatJSON(obj: any, indent = 2): string {
  const json = JSON.stringify(obj, null, indent);
  return json
    .replace(/"([^"]+)":/g, chalk.cyan('"$1":'))
    .replace(/: "([^"]+)"/g, `: ${chalk.green('"$1"')}`)
    .replace(/: (\d+)/g, `: ${chalk.yellow('$1')}`)
    .replace(/: (true|false)/g, (_, bool) => `: ${chalk.magenta(bool)}`);
}

/**
 * Create a summary box with key metrics
 */
export function summaryBox(metrics: {
  title: string;
  items: Array<{ label: string; value: string | number; color?: string }>;
}): void {
  const lines = metrics.items.map(({ label, value, color }) => {
    const colorFn = color ? (chalk as any)[color] : chalk.white;
    return `${chalk.gray(label + ':')} ${colorFn(value)}`;
  });

  box(lines.join('\n'), metrics.title);
}

/**
 * Log error with stack trace
 */
export function logError(err: Error, verbose = false): void {
  error(err.message);

  if (verbose && err.stack) {
    console.log(chalk.gray(err.stack));
  }
}

/**
 * Clear console
 */
export function clear(): void {
  console.clear();
}
