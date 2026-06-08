import fs from 'fs';
import path from 'path';
import { parseMatchWorkbook } from '@/lib/excelImport';

const templatePath = path.join(process.cwd(), 'public/templates/SATRF_Score_Import.xlsx');

describe('excelImport — SATRF_Score_Import.xlsx', () => {
  const ctx = {
    eventId: 'evt-1',
    eventName: 'Test Event',
    date: '2026-06-01',
  };

  it('parses 3-Position qual with 2 series per position', () => {
    if (!fs.existsSync(templatePath)) return;
    const buffer = fs.readFileSync(templatePath).buffer;
    const rows = parseMatchWorkbook(buffer, ctx);
    const threeP = rows.filter((r) => r.sheet === '3-Position 50m' && r.input && !r.errors?.length);
    expect(threeP.length).toBeGreaterThan(0);
    const first = threeP[0].input!;
    expect(first.stage).toBe('qualification');
    expect(first.discipline).toBe('three_position_50m');
    expect(first.positions).toHaveLength(3);
    first.positions.forEach((p) => {
      expect(p.series).toHaveLength(2);
      expect(p.aggregate).toBeFalsy();
    });
  });

  it('parses Prone 50m qualification rows', () => {
    if (!fs.existsSync(templatePath)) return;
    const buffer = fs.readFileSync(templatePath).buffer;
    const rows = parseMatchWorkbook(buffer, ctx);
    const prone = rows.filter((r) => r.sheet === 'Prone 50m' && r.input && !r.errors?.length);
    expect(prone.length).toBeGreaterThan(0);
    expect(prone[0].input?.stage).toBe('qualification');
    expect(prone[0].input?.positions[0].series).toHaveLength(6);
  });
});
