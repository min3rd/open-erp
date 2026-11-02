// Sprint 08 QA fix: mark jsonb value params in form/workflow query descriptors
// (the data gateway binds unmarked params as varchar -> PostgreSQL type error).
import fs from 'node:fs';

const jsonbParams = {
  'form.insert': ['document', 'entity_mapping'],
  'form.update': ['document', 'entity_mapping'],
  'form.version.insert': ['document', 'entity_mapping'],
  'form.response.insert': ['answers'],
  'definition.insert': ['document'],
  'instance.insert': ['source_ref', 'context'],
  'task.insert': ['assignees', 'candidates'],
  'task.update': ['assignees', 'action_votes', 'reminder_slots'],
  'event.insert': ['payload'],
  'trigger.insert': ['filter'],
};

for (const plugin of ['form', 'workflow']) {
  const file = `plugins/${plugin}/plugin.json`;
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  let patched = 0;
  for (const query of manifest.queries ?? []) {
    const params = jsonbParams[query.id];
    if (!params || !query.values) continue;
    for (const [name, spec] of Object.entries(query.values)) {
      if (params.includes(name)) {
        spec.type = 'jsonb';
        patched++;
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${plugin}: marked ${patched} jsonb params, version=${manifest.version}`);
}
