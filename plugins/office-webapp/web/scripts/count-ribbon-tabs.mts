import { WORD_RIBBON } from '../src/app/core/office/word-ribbon.ts';

for (const tab of WORD_RIBBON) {
  console.log(tab.id, 'groups=' + tab.groups.length, 'items=' + tab.groups.reduce((sum, group) => sum + group.items.length, 0));
}
