import assert from "node:assert/strict";

export function auditPath(file) {
  const forbidden = /(?:^|\/)(?:metadata\.json|movements\.md|evidence\.md|local|notes|research|transcripts?|audiobooks?|node_modules|dist|test-results|playwright-report|\.aws|\.terraform|\.env(?:\..*)?)(?:\/|$)|\.(?:m4b|mp3|wav|flac|aiff|blend1|pem|key|tfstate|map)$|(?:^|\/)\.claude\/(?:settings\.local\.json|scheduled_tasks\.lock)$/i;
  assert(!forbidden.test(file), `Public release: excluded file ${file}`);
}
export function auditText(file, text) {
  const forbidden = /\/(?:Users|home)\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{70,}\b/;
  assert(!forbidden.test(text), `Public release: secret or machine path in ${file}`);
}
