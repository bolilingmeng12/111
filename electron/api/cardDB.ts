import * as fs from 'fs';
import * as path from 'path';
import type { Card } from '../../shared/types';

/**
 * CardDB: 简化示例，仅包含传奇（legendary）卡表的 JSON。
 * 你可以替换 data/legendaries.json 为完整卡表。
 */

export class CardDB {
  private cards: Card[] = [];

  constructor() {
    const p = path.join(__dirname, '../data/legendaries.json');
    if (fs.existsSync(p)) {
      this.cards = JSON.parse(fs.readFileSync(p, 'utf-8')) as Card[];
    } else {
      // 示例：若没有文件则初始化几个示例传奇
      this.cards = [
        { id: 'L1', name: '示例传奇A', mana: 8, rarity: 'LEGENDARY', class: 'NEUTRAL', maxCopies: 1 },
        { id: 'L2', name: '示例传奇B', mana: 9, rarity: 'LEGENDARY', class: 'NEUTRAL', maxCopies: 1 },
        { id: 'L3', name: '示例传奇C', mana: 6, rarity: 'LEGENDARY', class: 'NEUTRAL', maxCopies: 1 }
      ];
    }
  }

  getLegendaries() {
    return this.cards;
  }

  findById(id: string) {
    return this.cards.find(c => c.id === id);
  }
}
