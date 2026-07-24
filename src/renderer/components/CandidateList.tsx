import React from 'react';
import type { Card, PosteriorMap } from '../../../../shared/types';

export default function CandidateList({ cards, posterior }: { cards: Card[]; posterior: PosteriorMap }) {
  const items = cards.map(c => {
    const p = posterior[c.id];
    return {
      ...c,
      prior: p?.prior ?? 0,
      posterior: p?.posterior ?? 0,
      seen: p?.seen ?? 0
    };
  }).sort((a, b) => b.posterior - a.posterior);

  return (
    <div style={{ border: '1px solid #ddd', padding: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>卡名</th>
            <th>先验</th>
            <th>后验</th>
            <th>已见</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.name} ({it.id})</td>
              <td style={{ textAlign: 'center' }}>{(it.prior * 100).toFixed(1)}%</td>
              <td style={{ textAlign: 'center' }}>{(it.posterior * 100).toFixed(1)}%</td>
              <td style={{ textAlign: 'center' }}>{it.seen ? '✓' : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
