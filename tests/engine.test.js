import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRecommendation, rankUniverse } from '../shared/engine.js';
import { writeHandoffFile } from '../scripts/generate-handoff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const fundsData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/funds.json'), 'utf8'));
const modelState = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data/model-state.json'), 'utf8'));

test('Fund universe contains only non-individual stock baskets (9 Versa + 9 US ETFs)', () => {
  assert.equal(fundsData.funds.length, 18);
  const versa = fundsData.funds.filter((f) => f.platform === 'Versa');
  const usEtfs = fundsData.funds.filter((f) => f.platform === 'US ETF');
  assert.equal(versa.length, 9);
  assert.equal(usEtfs.length, 9);
});

test('Balanced layman recommendation sums strictly to 100% and exact RM amounts', () => {
  const rec = generateRecommendation(
    {
      initialAmountMyr: 5000,
      monthlyContributionMyr: 800,
      horizon: 'medium_long',
      emergencyBuffer: 'partial',
      dipComfort: 'moderate',
      shariahOnly: false,
      projectionYears: 10
    },
    fundsData,
    modelState
  );

  const totalPct = rec.allocations.reduce((s, a) => s + a.weight, 0);
  const totalInit = rec.allocations.reduce((s, a) => s + a.initialMyr, 0);
  const totalMon = rec.allocations.reduce((s, a) => s + a.monthlyMyr, 0);

  assert.equal(totalPct, 100);
  assert.equal(totalInit, 5000);
  assert.equal(totalMon, 800);
  assert.ok(rec.metrics.versaSharePct > 0, 'Includes Versa MYR sleeve');
  assert.ok(rec.metrics.usEtfSharePct > 0, 'Includes US ETF USD sleeve');
});

test('Shariah-Only (-i) toggle excludes all non-Shariah funds', () => {
  const rec = generateRecommendation(
    {
      initialAmountMyr: 8000,
      monthlyContributionMyr: 1000,
      horizon: 'long',
      emergencyBuffer: 'full',
      dipComfort: 'growth',
      shariahOnly: true,
      projectionYears: 10
    },
    fundsData,
    modelState
  );

  assert.equal(rec.allocations.reduce((s, a) => s + a.weight, 0), 100);
  for (const item of rec.allocations) {
    assert.equal(item.shariah, true, `Expected ${item.ticker} to be Shariah-compliant`);
  }

  const rankedHalal = rankUniverse(fundsData.funds, modelState, true);
  assert.ok(rankedHalal.every((f) => f.shariah === true));
});

test('Short-term (<1 year) guardrail protects beginners from volatile stock sleeves', () => {
  const rec = generateRecommendation(
    {
      initialAmountMyr: 10000,
      monthlyContributionMyr: 500,
      horizon: 'short',
      emergencyBuffer: 'none',
      dipComfort: 'growth',
      shariahOnly: false
    },
    fundsData,
    modelState
  );

  assert.equal(rec.buckets.core_growth, 0);
  assert.equal(rec.buckets.high_growth, 0);
  assert.ok(Math.abs(rec.metrics.estimatedWorstDipPct) < 2.0);
});

test('handoff.md generator writes comprehensive living reference', () => {
  const res = writeHandoffFile();
  assert.ok(fs.existsSync(res.path));
  assert.ok(res.content.includes('FundPilot MY'));
  assert.ok(res.content.includes('Versa Cash'));
  assert.ok(res.content.includes('VOO'));
});
