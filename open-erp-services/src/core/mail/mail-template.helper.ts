import * as fs from 'fs';
import * as path from 'path';

export function renderEmailTemplate(
  templateName: string,
  locale: string,
  variables: Record<string, string>,
): { subject: string; html: string } {
  const currentLocale = locale === 'en' ? 'en' : 'vi';

  // Base templates directory is core/mail/templates
  // Since this file resides in core/mail, templates folder is adjacent
  const templatesDir = path.join(__dirname, 'templates');

  // Read subjects configuration
  const subjectsPath = path.join(templatesDir, 'subjects.json');
  if (!fs.existsSync(subjectsPath)) {
    throw new Error(`Email subjects configuration not found at ${subjectsPath}`);
  }
  const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf-8'));
  let subject = subjects[currentLocale]?.[templateName] || subjects['vi']?.[templateName] || '';

  // Interpolate variables in subject
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Determine HTML path
  let htmlPath = path.join(templatesDir, `${templateName}.${currentLocale}.html`);
  if (!fs.existsSync(htmlPath)) {
    // fallback to vi
    htmlPath = path.join(templatesDir, `${templateName}.vi.html`);
  }

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Email template HTML not found at ${htmlPath}`);
  }

  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Interpolate variables in HTML body
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return { subject, html };
}
