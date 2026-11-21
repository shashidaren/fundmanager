import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { generateRecommendation, rankUniverse } from '../shared/engine.js';
import { runCalibration } from '../scripts/calibrate.js';
import { writeHandoffFile } from '../scripts/generate-handoff.js';
import { getGitStatusSummary, pullFromGit, syncToGit } from './gitSync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8'));
}

function writeJson(relPath, data) {
  fs.writeFileSync(path.join(ROOT_DIR, relPath), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function buildAppPayload({ refreshHandoff = false } = {}) {
  const fundsData = readJson('data/funds.json');
  const modelState = readJson('data/model-state.json');
  const calibrationHistory = readJson('data/calibration-history.json');
  const requirements = readJson('data/requirements.json');
  const handoffPath = path.join(ROOT_DIR, 'handoff.md');
  const handoffMarkdown =
    refreshHandoff || !fs.existsSync(handoffPath)
      ? writeHandoffFile().content
      : fs.readFileSync(handoffPath, 'utf8');
  const profile = modelState.activeInvestorProfile || {};
  const recommendation = generateRecommendation(profile, fundsData, modelState);
  const rankedFunds = rankUniverse(fundsData.funds, modelState, false);
  const gitStatus = getGitStatusSummary();

  return {
    fundsData,
    modelState,
    calibrationHistory,
    requirements,
    recommendation,
    rankedFunds,
    handoffMarkdown,
    gitStatus
  };
}

export async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'fundpilot-my', timestamp: new Date().toISOString() });
  });

  app.get('/api/bootstrap', (_req, res) => {
    try {
      res.json(buildAppPayload());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile', (req, res) => {
    try {
      const modelState = readJson('data/model-state.json');
      const incoming = req.body || {};
      modelState.activeInvestorProfile = {
        ...modelState.activeInvestorProfile,
        initialAmountMyr: Math.max(0, Number(incoming.initialAmountMyr ?? modelState.activeInvestorProfile.initialAmountMyr)),
        monthlyContributionMyr: Math.max(
          0,
          Number(incoming.monthlyContributionMyr ?? modelState.activeInvestorProfile.monthlyContributionMyr)
        ),
        horizon: incoming.horizon || modelState.activeInvestorProfile.horizon,
        emergencyBuffer: incoming.emergencyBuffer || modelState.activeInvestorProfile.emergencyBuffer,
        dipComfort: incoming.dipComfort || modelState.activeInvestorProfile.dipComfort,
        shariahOnly:
          typeof incoming.shariahOnly === 'boolean'
            ? incoming.shariahOnly
            : modelState.activeInvestorProfile.shariahOnly,
        projectionYears: Math.min(25, Math.max(1, Number(incoming.projectionYears ?? modelState.activeInvestorProfile.projectionYears ?? 10)))
      };
      writeJson('data/model-state.json', modelState);
      res.json(buildAppPayload({ refreshHandoff: true }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/calibrate', async (req, res) => {
    try {
      const { trigger, feedbackSignal, marketScenario } = req.body || {};
      const calResult = await runCalibration({
        trigger: trigger || (feedbackSignal ? `user-feedback:${feedbackSignal}` : 'dashboard-manual-trigger'),
        feedbackSignal: feedbackSignal || null,
        marketScenario: marketScenario || 'auto'
      });
      res.json({
        calibrationResult: calResult.run,
        ...buildAppPayload()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/funds/update', (req, res) => {
    try {
      const { fundId, expectedReturn, expenseRatio, fxUsdMyr } = req.body || {};
      const fundsData = readJson('data/funds.json');
      const modelState = readJson('data/model-state.json');

      if (fxUsdMyr && Number(fxUsdMyr) > 2.5 && Number(fxUsdMyr) < 7.5) {
        fundsData.fxUsdMyr = Math.round(Number(fxUsdMyr) * 100) / 100;
        modelState.fxUsdMyr = fundsData.fxUsdMyr;
        writeJson('data/model-state.json', modelState);
      }

      if (fundId) {
        const target = fundsData.funds.find((f) => f.id === fundId);
        if (!target) {
          return res.status(404).json({ error: 'Fund not found' });
        }
        if (expectedReturn !== undefined && Number.isFinite(Number(expectedReturn))) {
          target.expectedReturn = Math.max(0, Math.min(25, Math.round(Number(expectedReturn) * 100) / 100));
        }
        if (expenseRatio !== undefined && Number.isFinite(Number(expenseRatio))) {
          target.expenseRatio = Math.max(0, Math.min(5, Math.round(Number(expenseRatio) * 100) / 100));
        }
      }

      fundsData.lastUpdated = new Date().toISOString();
      writeJson('data/funds.json', fundsData);
      res.json(buildAppPayload({ refreshHandoff: true }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/requirements', (req, res) => {
    try {
      const { action, title, category, notes, id, status } = req.body || {};
      const reqData = readJson('data/requirements.json');

      if (action === 'add' && title && title.trim()) {
        const nextNum = (reqData.items?.length || 0) + 1;
        reqData.items.push({
          id: `req-${String(nextNum).padStart(2, '0')}-${Date.now().toString().slice(-3)}`,
          title: title.trim(),
          category: (category || 'Future Iteration').trim(),
          status: status || 'planned',
          notes: (notes || 'Added from dashboard roadmap tracker.').trim()
        });
      } else if (action === 'toggle' && id) {
        const item = reqData.items.find((i) => i.id === id);
        if (item) {
          item.status = item.status === 'implemented' ? 'planned' : 'implemented';
        }
      } else if (action === 'delete' && id) {
        reqData.items = reqData.items.filter((i) => i.id !== id);
      }

      reqData.lastUpdated = new Date().toISOString();
      writeJson('data/requirements.json', reqData);
      res.json(buildAppPayload({ refreshHandoff: true }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/git/status', (_req, res) => {
    res.json(getGitStatusSummary());
  });

  app.post('/api/git/sync', (req, res) => {
    try {
      const { message } = req.body || {};
      const syncResult = syncToGit(message || '');
      res.json({
        syncResult,
        ...buildAppPayload()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/git/pull', (_req, res) => {
    try {
      const pullResult = pullFromGit();
      res.json({
        pullResult,
        ...buildAppPayload()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: ROOT_DIR,
      server: { middlewareMode: true, allowedHosts: true, hmr: { server: httpServer } },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return { app, httpServer };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const port = Number(process.env.PORT || 3000);
  createServer().then(({ httpServer }) => {
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`FundPilot MY server listening on http://0.0.0.0:${port}`);
    });
  });
}
