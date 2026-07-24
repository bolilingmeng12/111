export type Card = {
  id: string;
  name: string;
  mana: number;
  rarity: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  class: string;
  maxCopies: number;
};

export type Observation = {
  id?: string;
  matchId?: string | null;
  timestamp?: number;
  turn?: number;
  actor?: 'opponent' | 'player';
  cardId: string;
  zone: 'played' | 'hand_shown' | 'mulligan_shown' | 'generated' | 'discarded';
  count?: number;
  note?: string;
};

export type MatchRecord = {
  id: string;
  opponentClass: string;
  startedAt: number;
  observations: Observation[];
};

export type PosteriorEntry = {
  prior: number;
  posterior: number;
  seen: number;
};

export type PosteriorMap = {
  [cardId: string]: PosteriorEntry;
};
