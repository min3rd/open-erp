// Direct probe of the workflow plugin internal instance endpoint (in-container).
import { execSync } from 'node:child_process';

const tenant = process.argv[2];
const adminUserId = process.argv[3];
const body = JSON.stringify({
  definition_key: 'employee-profile-change',
  context: {
    entity: { personal_email: 'probe@example.com' },
    initiator: { user_id: adminUserId, manager_user_id: adminUserId },
    managers: { 'initiator.manager_user_id': adminUserId },
    role_users_TENANT_ADMIN: [adminUserId],
  },
  idempotency_key: 'probe-direct-' + Date.now(),
  source_ref: { probe: true },
}).replace(/'/g, "'\\''");

const out = execSync(
  `docker exec openerp-plugin-workflow-1-0-3 sh -c "wget -qO- -T 5 --header='Content-Type: application/json' --header='X-Tenant-Id: ${tenant}' --post-data='${body}' http://localhost:8080/api/v1/workflow/internal/instances 2>&1"`,
  { encoding: 'utf8' },
);
console.log(out.slice(0, 500));
