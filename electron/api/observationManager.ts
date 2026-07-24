import { v4 as uuidv4 } from 'uuid';
import type { Observation, MatchRecord } from '../../shared/types';

/**
 * ObservationManager 管理当前对局：记录观测、提供导出接口
 * 本模块为内存实现，保存/加载由 storage.js 负责
 */

export class ObservationManager {
  private currentMatchId: string | null = null;
  private opponentClass: string = 'NEUTRAL';
  private observations: Observation[] = [];
  private startedAt: number = Date.now();

  startMatch(opponentClass: string = 'NEUTRAL') {
    this.currentMatchId = uuidv4();
    this.opponentClass = opponentClass;
    this.observations = [];
    this.startedAt = Date.now();
  }

  resetMatch() {
    this.currentMatchId = null;
    this.opponentClass = 'NEUTRAL';
    this.observations = [];
    this.startedAt = Date.now();
  }

  addObservation(obs: Observation) {
    const o: Observation = {
      id: uuidv4(),
      matchId: this.currentMatchId,
      timestamp: Date.now(),
      ...obs
    };
    this.observations.push(o);
    return o;
  }

  getObservations() {
    return this.observations.slice();
  }

  exportCurrentMatch(): MatchRecord {
    return {
      id: this.currentMatchId || uuidv4(),
      opponentClass: this.opponentClass,
      startedAt: this.startedAt,
      observations: this.getObservations()
    };
  }
}
