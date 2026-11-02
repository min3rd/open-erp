// POST the workflow-proxy open call from INSIDE the employee container,
// exactly the path/headers the WorkflowApprovalClient uses.
import { execSync } from 'node:child_process';

const tenant = process.argv[2];
const adminUserId = process.argv[3];
const body = JSON.stringify({
  definition_key: 'employee-profile-change',
  context: {
    entity: { personal_email: 'in-container@example.com' },
    initiator: { user_id: adminUserId, manager_user_id: adminUserId },
    managers: { 'initiator.manager_user_id': adminUserId },
    role_users_TENANT_ADMIN: [adminUserId],
  },
  idempotency_key: 'in-employee-' + Date.now(),
  source_ref: { probe: 'employee-container' },
  initiated_by: adminUserId,
}).replace(/'/g, "'\\''");

const out = execSync(
  `docker exec openerp-plugin-employee-1-2-1 sh -c "wget -S -qO- -T 8 --header='Content-Type: application/json' --header='X-Plugin-Fanout-Token: dev-fanout-token' --header='X-Tenant-Id: ${tenant}' --post-data='${body}' http://backend-dev:8080/api/v1/internal/workflow/instances 2>&1"`,
  { encoding: 'utf8', maxBuffer: 1024 * 1024 },
);
console.log(out.slice(0, 800));
