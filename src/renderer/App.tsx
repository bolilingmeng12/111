import React, { useEffect, useState } from 'react';
import ObservationForm from './components/ObservationForm';
import CandidateList from './components/CandidateList';
import type { Card, Observation, PosteriorMap } from '../../../shared/types';

declare global {
  interface Window {
    electronAPI: any;
  }
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [posterior, setPosterior] = useState<PosteriorMap>({});
  const [status, setStatus] = useState<any>({});
  const [observations, setObservations] = useState<Observation[]>([]);
  const [opponentClass, setOpponentClass] = useState<string>('NEUTRAL');

  useEffect(() => {
    window.electronAPI.getCandidates().then((res: any) => {
      setCards(res.candidates || []);
    });
  }, []);

  async function startMatch() {
    await window.electronAPI.startMatch({ opponentClass });
    const quick = await window.electronAPI.quickInfer();
    setPosterior(quick);
    setObservations([]);
  }

  async function resetMatch() {
    await window.electronAPI.resetMatch();
    const quick = await window.electronAPI.quickInfer();
    setPosterior(quick);
    setObservations([]);
  }

  async function addObservation(obs: Observation) {
    const res = await window.electronAPI.addObservation(obs);
    if (res?.quick) setPosterior(res.quick);
    setObservations(prev => [...prev, obs]);
  }

  async function startImportance() {
    await window.electronAPI.startImportance({ samples: 5000 });
    pollStatus();
  }

  async function pollStatus() {
    const s = await window.electronAPI.inferStatus();
    setStatus(s);
    if (s.running) {
      setTimeout(pollStatus, 1000);
    } else {
      const p = await window.electronAPI.getPosterior();
      setPosterior(p.posterior);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h2>竞技场传说推断器（原型）</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <label>对手职业: </label>
            <input value={opponentClass} onChange={e => setOpponentClass(e.target.value)} />
            <button onClick={startMatch} style={{ marginLeft: 8 }}>开始对局</button>
            <button onClick={resetMatch} style={{ marginLeft: 8 }}>重置</button>
          </div>
          <ObservationForm cards={cards} onAdd={addObservation} />
          <div style={{ marginTop: 12 }}>
            <button onClick={startImportance}>后台重要性采样（5000）</button>
            <button onClick={async () => { await window.electronAPI.saveMatch(); alert('已保存'); }} style={{ marginLeft: 8 }}>保存对局</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>观测日志（最近）</h4>
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
              {observations.length === 0 ? <div>暂无观测</div> :
                observations.map((o, i) => <div key={i}>{o.zone} - {o.cardId} ({o.actor || 'opponent'})</div>)}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4>候选传奇（posterior）</h4>
          <CandidateList cards={cards} posterior={posterior} />
          <div style={{ marginTop: 12 }}>
            <pre style={{ background: '#f6f6f6', padding: 8 }}>
              {JSON.stringify({ status }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
