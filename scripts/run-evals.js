#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');
const MODEL      = process.env.EVAL_MODEL || 'gpt-4o-mini';
const ENDPOINT   = 'https://models.inference.ai.azure.com/chat/completions';

const FILTER = process.argv[2];

async function callModel(messages) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, messages }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function runScenario(scenario, skillContent) {
  const system = [
    'You are a helpful AI assistant. The following skill is active and you MUST follow its instructions exactly:',
    '',
    skillContent,
  ].join('\n');

  const text = await callModel([
    { role: 'system', content: system },
    { role: 'user',   content: scenario.prompt },
  ]);

  const failures = [];
  for (const kw of (scenario.must_contain || [])) {
    if (!text.toLowerCase().includes(kw.toLowerCase())) failures.push(`missing "${kw}"`);
  }
  for (const kw of (scenario.must_not_contain || [])) {
    if (text.toLowerCase().includes(kw.toLowerCase())) failures.push(`forbidden "${kw}" found`);
  }

  return { passed: failures.length === 0, failures, response: text };
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('ERROR: GITHUB_TOKEN is not set');
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .filter(d => !FILTER || d === FILTER)
    .sort();

  if (skillDirs.length === 0) {
    console.error(FILTER ? `ERROR: skill '${FILTER}' not found` : 'ERROR: no skills found');
    process.exit(1);
  }

  let totalScenarios = 0, totalPassed = 0, totalFailed = 0;
  const summary = [];

  for (const dirName of skillDirs) {
    const evalsPath = path.join(SKILLS_DIR, dirName, 'evals.json');
    const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');

    if (!fs.existsSync(evalsPath)) {
      console.log(`  -  ${dirName}  (no evals.json, skipping)`);
      continue;
    }

    const skillContent = fs.readFileSync(skillPath, 'utf8');
    const { scenarios } = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));

    console.log(`\n${dirName} (${scenarios.length} scenario(s))`);

    for (const scenario of scenarios) {
      totalScenarios++;
      process.stdout.write(`     ${scenario.name} ... `);

      try {
        const result = await runScenario(scenario, skillContent);
        if (result.passed) {
          totalPassed++;
          console.log('PASS');
        } else {
          totalFailed++;
          console.log(`FAIL — ${result.failures.join(', ')}`);
          if (process.env.EVAL_VERBOSE) {
            console.log(`       Response: ${result.response.slice(0, 300)}`);
          }
        }
        summary.push({ skill: dirName, scenario: scenario.name, passed: result.passed, failures: result.failures });
      } catch (err) {
        totalFailed++;
        console.log(`ERROR — ${err.message}`);
        summary.push({ skill: dirName, scenario: scenario.name, passed: false, failures: [err.message] });
      }
    }
  }

  console.log(`\n${totalScenarios} scenario(s) — ${totalPassed} passed, ${totalFailed} failed`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      '## Skill Evals', '',
      '| Skill | Scenario | Result |',
      '|-------|----------|--------|',
      ...summary.map(r =>
        `| ${r.skill} | ${r.scenario} | ${r.passed ? 'PASS' : `FAIL: ${r.failures.join(', ')}`} |`
      ),
      '',
      `**${totalPassed}/${totalScenarios} passed**`,
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  }

  if (totalFailed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
