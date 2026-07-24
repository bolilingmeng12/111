import React, { useState } from 'react';
import type { Card, Observation } from '../../../../shared/types';

export default function ObservationForm({ cards, onAdd }: { cards: Card[]; onAdd: (o: Observation) => void }) {
  const [cardId, setCardId] = useState('');
  const [zone, setZone] = useState<'played' | 'hand_shown' | 'mulligan_shown' | 'generated' | 'discarded'>('played');

  return (
    <div style={{ border: '1px solid #ddd', padding: 8 }}>
      <h4>录入观测</h4>
      <div>
        <label>卡名/ID: </label>
        <input list="cardlist" value={cardId} onChange={e => setCardId(e.target.value)} />
        <datalist id="cardlist">
          {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </datalist>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>类型: </label>
        <select value={zone} onChange={e => setZone(e.target.value as any)}>
          <option value="played">played（对手打出）</option>
          <option value="hand_shown">hand_shown（展示手牌）</option>
          <option value="mulligan_shown">mulligan_shown（开局展示）</option>
          <option value="generated">generated（生成/复制）</option>
          <option value="discarded">discarded（弃牌）</option>
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => {
          if (!cardId) return alert('请输入卡ID');
          onAdd({ cardId, zone, actor: 'opponent' });
          setCardId('');
        }}>提交观测</button>
      </div>
    </div>
  );
}
