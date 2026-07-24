import type { Card, Observation, PosteriorMap } from '../../shared/types';
import { ObservationManager } from './observationManager';
import { CardDB } from './cardDB';

/**
 * InferenceEngine 实现（简化原型）：
 * - estimateIndependent(): 快速独立近似（即时）
 * - startImportanceSampling(samples): 后台重要性采样（并行/异步）
 *
 * 注意：此原型将重要性采样中的似然简化为“与观测一致 => 权重1，否则0”以便快速得到可用结果。
 * 你可以把 computeLikelihood() 替换为更精细的模拟/超几何模型。
 */

type ImportanceStatus = {
  running: boolean;
  samplesTried: number;
  validSamples: number;
  lastUpdatedAt: number | null;
};

export class InferenceEngine {
  private cardDB: CardDB;
  private obsMgr: ObservationManager;
  private settings = {
    deckSize: 30,
    priorSource: 'uniform',
    expectedLegendaryCount: 1.0
  };
  private posterior: PosteriorMap = {};
  private status: ImportanceStatus = { running: false, samplesTried: 0, validSamples: 0, lastUpdatedAt: null };

  constructor(cardDB: CardDB, obsMgr: ObservationManager) {
    this.cardDB = cardDB;
    this.obsMgr = obsMgr;
    const cards = this.cardDB.getLegendaries();
    cards.forEach(c => {
      this.posterior[c.id] = { prior: 1 / cards.length, posterior: 1 / cards.length, seen: 0 };
    });
  }

  getSettings() {
    return this.settings;
  }

  reset() {
    const cards = this.cardDB.getLegendaries();
    this.posterior = {};
    cards.forEach(c => {
      this.posterior[c.id] = { prior: 1 / cards.length, posterior: 1 / cards.length, seen: 0 };
    });
    this.status = { running: false, samplesTried: 0, validSamples: 0, lastUpdatedAt: null };
  }

  estimateIndependent() {
    // 快速独立近似：如果已见则 posterior=1；否则用 prior * likelihood(no-see) 近似
    const cards = this.cardDB.getLegendaries();
    const obs = this.obsMgr.getObservations();
    const seenSet = new Set(obs.filter(o => o.zone === 'played' || o.zone === 'hand_shown').map(o => o.cardId));
    const t = obs.length; // 简化：把观测数当成已打/已见数（实际应统计对手已打出的卡数量）
    const D = this.settings.deckSize;
    const result: PosteriorMap = {};
    cards.forEach(c => {
      const prior = this.posterior[c.id]?.prior ?? (1 / cards.length);
      if (seenSet.has(c.id)) {
        result[c.id] = { prior, posterior: 1, seen: 1 };
      } else {
        // 近似 P(not seen | in deck) = C(D-1, t) / C(D, t) = (D-1 choose t)/(D choose t) = (D-t)/D
        // 更精确需要超几何，但此处简化
        const pNotSeenIfIn = Math.max(0, (D - t) / D);
        const likelihood_in = pNotSeenIfIn;
        const likelihood_not = 1; // 如果不在牌库一定不会被见到
        const num = prior * likelihood_in;
        const den = num + (1 - prior) * likelihood_not;
        const post = den > 0 ? num / den : prior;
        result[c.id] = { prior, posterior: post, seen: 0 };
      }
    });
    // update internal posterior quick snapshot
    this.posterior = result;
    return result;
  }

  getPosterior() {
    return { posterior: this.posterior };
  }

  getStatus() {
    return this.status;
  }

  async startImportanceSampling(samples: number = 5000) {
    if (this.status.running) return;
    this.status.running = true;
    this.status.samplesTried = 0;
    this.status.validSamples = 0;
    this.status.lastUpdatedAt = Date.now();

    const cards = this.cardDB.getLegendaries();
    const cardIds = cards.map(c => c.id);
    const obs = this.obsMgr.getObservations();
    const observedLegendarySet = new Set(obs.filter(o => o.zone === 'played' || o.zone === 'hand_shown').map(o => o.cardId));

    // proposal: sample K ~ Poisson(lambda=expectedLegendaryCount)+cap
    const lambda = Math.max(0.1, this.settings.expectedLegendaryCount);

    // We'll do simple importance sampling: sample S by sampling K distinct IDs according to prior weights
    const priorWeights = cardIds.map(id => this.posterior[id]?.prior ?? 1 / cardIds.length);

    const weightAcc: Record<string, number> = {};
    cardIds.forEach(id => (weightAcc[id] = 0));
    let valid = 0;
    for (let i = 0; i < samples; i++) {
      if (!this.status.running) break;
      this.status.samplesTried++;
      const K = Math.max(0, Math.round(poissonSample(lambda)));
      const S = sampleSetWeighted(cardIds, priorWeights, K);
      // consistency check: all observed legendary must be in S
      let consistent = true;
      for (const oid of observedLegendarySet) {
        if (!S.has(oid)) {
          consistent = false;
          break;
        }
      }
      if (!consistent) continue;
      // for prototype: set likelihood = 1 if consistent (can be improved)
      valid++;
      S.forEach(id => (weightAcc[id] += 1));
      // update status occasionally
      if (i % 500 === 0) this.status.lastUpdatedAt = Date.now();
    }

    // normalize
    const posterior: PosteriorMap = {};
    const totalWeight = Object.values(weightAcc).reduce((a, b) => a + b, 0) || 1;
    cardIds.forEach(id => {
      const prior = this.posterior[id]?.prior ?? 1 / cardIds.length;
      posterior[id] = { prior, posterior: weightAcc[id] / totalWeight, seen: observedLegendarySet.has(id) ? 1 : 0 };
    });

    this.posterior = posterior;
    this.status.running = false;
    this.status.validSamples = valid;
    this.status.lastUpdatedAt = Date.now();
  }
}

/* ---------- helpers ---------- */

function poissonSample(lambda: number) {
  // Knuth
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  while (p > L) {
    k++;
    p *= Math.random();
  }
  return k - 1;
}

function sampleSetWeighted(items: string[], weights: number[], k: number): Set<string> {
  // sample without replacement using weighted reservoir-like approach (naive)
  const pool = items.slice();
  const w = weights.slice();
  const selected = new Set<string>();
  for (let i = 0; i < k && pool.length > 0; i++) {
    const idx = weightedIndex(w);
    selected.add(pool[idx]);
    pool.splice(idx, 1);
    w.splice(idx, 1);
  }
  return selected;
}

function weightedIndex(weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return Math.floor(Math.random() * weights.length);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}
