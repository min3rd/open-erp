import { createCommand } from '../commands/create.js';
import { generateCommand } from '../commands/generate.js';
import { validateCommand } from '../commands/validate.js';
import { askSelect, askText } from './prompt.js';

export async function runWizard() {
  console.log('\n@open-erp/cli — Plugin developer wizard');
  const action = await askSelect('Bạn muốn làm gì?', [
    'Tạo plugin mới',
    'Thêm entity vào plugin hiện tại',
    'Thêm field vào entity',
    'Thêm quan hệ entity',
    'Tạo màn CRUD cho entity',
    'Đăng ký UI contribution',
    'Validate plugin',
    'Thoát',
  ]);

  switch (action) {
    case 'Tạo plugin mới':
      return createCommand({});
    case 'Thêm entity vào plugin hiện tại':
      return runGenerateEntityWizard();
    case 'Thêm field vào entity':
      return runGenerateFieldWizard();
    case 'Thêm quan hệ entity':
      return runGenerateRelationWizard();
    case 'Tạo màn CRUD cho entity':
      return runGenerateCrudWizard();
    case 'Đăng ký UI contribution':
      return runGenerateContributionWizard();
    case 'Validate plugin':
      return validateCommand({});
    default:
      console.log('Không có thay đổi.');
      return undefined;
  }
}

export async function runGenerateWizard(sub) {
  switch (sub) {
    case 'entity':
      return runGenerateEntityWizard();
    case 'field':
      return runGenerateFieldWizard();
    case 'relation':
      return runGenerateRelationWizard();
    case 'crud':
      return runGenerateCrudWizard();
    case 'ui-contribution':
      return runGenerateContributionWizard();
    default:
      throw new Error('Interactive chỉ hỗ trợ: entity, field, relation, crud, ui-contribution');
  }
}

async function runGenerateEntityWizard() {
  const name = await askText('Tên entity (PascalCase)', 'Invoice');
  const fields = await askText('Fields (name:type, ...)', 'code:string:required+unique,name:string:required');
  return generateCommand({ _: ['entity'], name, fields });
}

async function runGenerateFieldWizard() {
  const entity = await askText('Entity', 'Invoice');
  const name = await askText('Tên field (snake_case)', 'status');
  const type = await askSelect('Kiểu field', ['string', 'text', 'int', 'long', 'decimal', 'bool', 'date', 'datetime', 'enum', 'json', 'uuid'], 0);
  const required = (await askText('Bắt buộc? (y/N)', 'n')).toLowerCase().startsWith('y');
  const unique = (await askText('Unique? (y/N)', 'n')).toLowerCase().startsWith('y');
  const enumValues = type === 'enum' ? await askText('Enum values (a,b,c)', 'ACTIVE,INACTIVE') : undefined;
  return generateCommand({ _: ['field'], entity, name, type, required, unique, enumValues });
}

async function runGenerateRelationWizard() {
  const entity = await askText('Entity chủ', 'Invoice');
  const name = await askText('Tên quan hệ (snake_case)', 'customer');
  const target = await askText('Target (self.X | core.user | plugin:catalog.CatalogItem)', 'core.user');
  const type = await askSelect('Cardinality', ['MANY_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY'], 0);
  const storage = target.startsWith('self.') ? 'FK' : 'SOFT_REF';
  const displayField = storage === 'SOFT_REF' ? await askText('Field hiển thị target', 'full_name') : undefined;
  const required = (await askText('Bắt buộc? (y/N)', 'n')).toLowerCase().startsWith('y');
  return generateCommand({ _: ['relation'], entity, name, target, type, storage, displayField, required });
}

async function runGenerateCrudWizard() {
  const entity = await askText('Entity', 'Invoice');
  const route = await askText('Route (để trống = mặc định)', '');
  return generateCommand({ _: ['crud'], entity, ...(route ? { route } : {}) });
}

async function runGenerateContributionWizard() {
  const slot = await askText('Slot', 'core.layout.header.actions');
  const renderMode = await askSelect('Render mode', ['web-component', 'module-federation'], 0);
  return generateCommand({ _: ['ui-contribution'], slot, renderMode });
}
