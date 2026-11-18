import { WORD_RIBBON } from '../src/app/core/office/word-ribbon.ts';

const tabs = WORD_RIBBON.length;
const groups = WORD_RIBBON.reduce((sum, tab) => sum + tab.groups.length, 0);
const items = WORD_RIBBON.reduce((sum, tab) => sum + tab.groups.reduce((groupSum, group) => groupSum + group.items.length, 0), 0);
const disabled = WORD_RIBBON.flatMap((tab) => tab.groups.flatMap((group) => group.items))
  .filter((item) => item.disabled)
  .map((item) => item.id);
console.log(JSON.stringify({ tabs, groups, items, disabled }, null, 2));
