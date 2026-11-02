// Direct probe of the core internal publish endpoint with fanout auth.
const tenant = process.argv[2];
(async () => {
  const r = await fetch('http://127.0.0.1:8088/api/v1/internal/plugin-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Plugin-Fanout-Token': 'dev-fanout-token',
      'X-Plugin-Key': 'form',
      'X-Tenant-Id': tenant,
    },
    body: JSON.stringify({
      event: 'probe.event',
      entity: 'Probe',
      aggregate_id: 'probe-1',
      payload: { hello: true },
      idempotency_key: 'probe-' + Date.now(),
    }),
  });
  console.log('publish:', r.status, JSON.stringify(await r.json()).slice(0, 300));
})();
