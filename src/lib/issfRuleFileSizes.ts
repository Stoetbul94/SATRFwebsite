import fs from 'fs';
import path from 'path';
import { issfRuleDocuments } from '@/data/issf-rules';

export function readIssfLocalFileSizes() {
  const fileSizes: Record<string, number> = {};
  for (const doc of issfRuleDocuments) {
    if (!doc.localPath) continue;
    const abs = path.join(process.cwd(), 'public', doc.localPath.replace(/^\//, ''));
    if (fs.existsSync(abs)) {
      fileSizes[doc.id] = fs.statSync(abs).size;
    }
  }
  return fileSizes;
}
