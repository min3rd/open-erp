// Probe the core internal workflow proxy exactly like the employee client.
const tenant = process.argv[2];
const adminUserId = process.argv[3];
(async () => {
  const open = await fetch('http://127.0.0.1:8088/api/v1/internal/workflow/instances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Plugin-Fanout-Token': 'dev-fanout-token',
      'X-Tenant-Id': tenant,
    },
    body: JSON.stringify({
      definition_key: 'employee-profile-change',
      context: {
        entity: { personal_email: 'probe@example.com' },
        initiator: { user_id: adminUserId, manager_user_id: adminUserId },
        managers: { 'initiator.manager_user_id': adminUserId },
        role_users_TENANT_ADMIN: [adminUserId],
      },
      idempotency_key: 'probe-' + Date.now(),
      source_ref: { probe: true },
    }),
  });
  console.log('open:', open.status, JSON.stringify(await open.json()).slice(0, 400));
})();
