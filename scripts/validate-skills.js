#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_LINES_WARN = 500;

function parseFrontmatter(content) {
  const match = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/);
  if (!match) return null;
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key   = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

function validateSkill(dirName) {
  const errors   = [];
  const warnings = [];
  const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    errors.push('Missing SKILL.md');
    return { errors, warnings };
  }

  const content = fs.readFileSync(skillPath, 'utf8');

  if (!content.trim()) {
    errors.push('SKILL.md is empty');
    return { errors, warnings };
  }

  const lines = content.split('\n').length;
  if (lines > MAX_LINES_WARN) {
    warnings.push(`${lines} lines (guideline: <${MAX_LINES_WARN})`);
  }

  const evalsPath = path.join(SKILLS_DIR, dirName, 'evals.json');
  if (!fs.existsSync(evalsPath)) {
    warnings.push('No evals.json — add behavioral eval scenarios');
  }

  const fm = parseFrontmatter(content);
  if (!fm) {
    warnings.push('No YAML frontmatter — consider adding name and description');
    return { errors, warnings };
  }

  if (!fm.name) {
    errors.push("Frontmatter missing required field: 'name'");
  } else if (fm.name !== dirName) {
    errors.push(`Frontmatter name '${fm.name}' does not match directory name '${dirName}'`);
  }

  if (!fm.description) {
    errors.push("Frontmatter missing required field: 'description'");
  } else {
    const raw = fm.description.replace(/^>/, '').trim();
    if (raw.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description is ${raw.length} chars — exceeds ${MAX_DESCRIPTION_LENGTH}-char limit`);
    }
  }

  return { errors, warnings };
}

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: skills/ directory not found at ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .sort();

  let totalErrors = 0, totalWarnings = 0;

  for (const dirName of skillDirs) {
    const { errors, warnings } = validateSkill(dirName);
    totalErrors   += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  ✓  ${dirName}`);
    } else {
      const icon = errors.length > 0 ? '  ✗ ' : '  ⚠ ';
      console.log(`${icon} ${dirName}`);
      for (const msg of errors)   console.log(`       ERROR: ${msg}`);
      for (const msg of warnings) console.log(`       WARN:  ${msg}`);
    }
  }

  const status = totalErrors > 0 ? 'FAILED' : totalWarnings > 0 ? 'PASSED WITH WARNINGS' : 'PASSED';
  console.log(`\n${skillDirs.length} skill(s) — ${totalErrors} error(s), ${totalWarnings} warning(s) — ${status}`);

  if (totalErrors > 0) process.exit(1);
}

main();
