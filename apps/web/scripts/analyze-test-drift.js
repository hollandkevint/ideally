#!/usr/bin/env node

/**
 * Test Drift Detection Script
 *
 * Analyzes E2E test files for potential issues:
 * - Deprecated routes (e.g., /dashboard instead of /app)
 * - Fragile selectors (e.g., Tailwind classes instead of data-testid)
 * - Outdated patterns
 *
 * Run with: node scripts/analyze-test-drift.js
 * Or: npm run test:drift
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns that indicate potential drift
const DRIFT_PATTERNS = [
  // Deprecated routes
  {
    pattern: /['"`]\/dashboard['"`]/g,
    issue: 'Uses deprecated /dashboard route',
    severity: 'error',
    suggestion: "Use ROUTES.app ('/app') instead",
  },
  {
    pattern: /['"`]\/workspace\/[^'")`]+['"`]/g,
    issue: 'Uses deprecated /workspace route',
    severity: 'error',
    suggestion: "Use ROUTES.appSession(id) ('/app/session/[id]') instead",
  },
  {
    pattern: /goto\(['"`]\/account['"`]\)/g,
    issue: 'Uses deprecated /account route',
    severity: 'warning',
    suggestion: "Use ROUTES.appAccount ('/app/account') instead",
  },

  // Fragile Tailwind class selectors
  {
    pattern: /locator\(['"`][^'"]*\.bg-[a-z]+-\d+/g,
    issue: 'Uses Tailwind background class as selector',
    severity: 'warning',
    suggestion: 'Use data-testid or role-based selector instead',
  },
  {
    pattern: /locator\(['"`][^'"]*\.text-[a-z]+-\d+/g,
    issue: 'Uses Tailwind text class as selector',
    severity: 'warning',
    suggestion: 'Use data-testid or role-based selector instead',
  },

  // Outdated data attributes
  {
    pattern: /data-workspace-id/g,
    issue: 'Uses old data-workspace-id attribute',
    severity: 'warning',
    suggestion: 'Should use data-session-id for sessions',
  },

  // Test.only left in tests
  {
    pattern: /test\.only\(/g,
    issue: 'test.only() found - will skip other tests',
    severity: 'error',
    suggestion: 'Remove .only() before committing',
  },

  // Long hardcoded waits
  {
    pattern: /waitForTimeout\(\d{5,}\)/g,
    issue: 'Very long waitForTimeout (10+ seconds)',
    severity: 'warning',
    suggestion: 'Consider using waitForSelector or other explicit waits',
  },
];

// Directories/files to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'helpers/',
  'fixtures/',
  'config/',
];

function shouldSkipFile(filepath) {
  return SKIP_PATTERNS.some((pattern) => filepath.includes(pattern));
}

function analyzeFile(filepath) {
  if (!filepath.endsWith('.spec.ts') || shouldSkipFile(filepath)) {
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    for (const drift of DRIFT_PATTERNS) {
      const matches = line.match(drift.pattern);
      if (matches) {
        matches.forEach((match) => {
          issues.push({
            file: filepath,
            line: index + 1,
            code: line.trim().substring(0, 100),
            issue: drift.issue,
            severity: drift.severity,
            suggestion: drift.suggestion,
          });
        });
      }
    }
  });

  return issues;
}

function walkDir(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldSkipFile(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function printIssue(issue) {
  const severityColors = {
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
  };
  const reset = '\x1b[0m';
  const color = severityColors[issue.severity] || '';

  console.log(`${color}[${issue.severity.toUpperCase()}]${reset} ${issue.file}:${issue.line}`);
  console.log(`  Issue: ${issue.issue}`);
  console.log(`  Code:  ${issue.code}`);
  if (issue.suggestion) {
    console.log(`  Fix:   ${issue.suggestion}`);
  }
  console.log('');
}

// Main execution
function main() {
  const testDir = path.resolve(__dirname, '../tests/e2e');

  console.log('');
  console.log('========================================');
  console.log('  E2E Test Drift Analysis');
  console.log('========================================');
  console.log('');
  console.log(`Scanning: ${testDir}`);
  console.log('');

  const specFiles = walkDir(testDir);
  console.log(`Found ${specFiles.length} test files`);
  console.log('');

  let allIssues = [];

  for (const file of specFiles) {
    const issues = analyzeFile(file);
    allIssues = allIssues.concat(issues);
  }

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Print results
  if (allIssues.length === 0) {
    console.log('\x1b[32m✅ No test drift detected!\x1b[0m');
    console.log('');
    process.exit(0);
  }

  console.log(`\x1b[33m⚠️  Found ${allIssues.length} potential issues:\x1b[0m`);
  console.log('');

  for (const issue of allIssues) {
    printIssue(issue);
  }

  // Summary
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const infoCount = allIssues.filter((i) => i.severity === 'info').length;

  console.log('----------------------------------------');
  console.log('Summary:');
  console.log(`  \x1b[31mErrors:   ${errorCount}\x1b[0m`);
  console.log(`  \x1b[33mWarnings: ${warningCount}\x1b[0m`);
  console.log(`  \x1b[36mInfo:     ${infoCount}\x1b[0m`);
  console.log('');

  // Exit with error if there are any errors
  if (errorCount > 0) {
    console.log('\x1b[31m❌ Test drift errors found - please fix before proceeding\x1b[0m');
    process.exit(1);
  }

  console.log('\x1b[33m⚠️  Warnings found - consider addressing these issues\x1b[0m');
  process.exit(0);
}

main();
