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
    const total = prone[0].input!.positions[0].series.reduce((s, x) => s + x.decimal, 0);
    expect(total).toBeGreaterThan(500);
  });

  it('parses F-Class qualification rows', () => {
    if (!fs.existsSync(templatePath)) return;
    const buffer = fs.readFileSync(templatePath).buffer;
    const rows = parseMatchWorkbook(buffer, ctx);
    const fclass = rows.filter((r) => r.sheet === 'F-Class' && r.input && !r.errors?.length);
    expect(fclass.length).toBeGreaterThan(0);
    expect(['fclass_open', 'fclass_tr']).toContain(fclass[0].input?.discipline);
    expect(fclass[0].input?.stage).toBe('qualification');
    expect(fclass[0].input?.positions[0].series).toHaveLength(6);
  });

  it('parses Prone Final with 6 series from header row 3', () => {
    if (!fs.existsSync(templatePath)) return;
    const buffer = fs.readFileSync(templatePath).buffer;
    const rows = parseMatchWorkbook(buffer, ctx);
    const finals = rows.filter((r) => r.sheet === 'Prone Final' && r.input && !r.errors?.length);
    expect(finals.length).toBeGreaterThan(0);
    const arnold = finals.find((r) => r.preview.shooterName === 'Arnold Prone');
    expect(arnold).toBeDefined();
    expect(arnold!.input?.stage).toBe('prone_final');
    expect(arnold!.input?.positions[0].series).toHaveLength(6);
    const total = arnold!.input!.positions[0].series.reduce((s, x) => s + x.decimal, 0);
    expect(total).toBeCloseTo(589.8, 1);
  });

  it('parses 3P Final series + elim from template sample row', () => {
    if (!fs.existsSync(templatePath)) return;
    const buffer = fs.readFileSync(templatePath).buffer;
    const rows = parseMatchWorkbook(buffer, ctx);
    const finals = rows.filter((r) => r.sheet === '3P Final' && r.input && !r.errors?.length);
    expect(finals.length).toBeGreaterThan(0);
    const lerato = finals.find((r) => r.preview.shooterName === 'Lerato Dlamini');
    expect(lerato).toBeDefined();
    expect(lerato!.input?.stage).toBe('3p_final');
    expect(lerato!.input?.positions).toHaveLength(3);
    lerato!.input!.positions.forEach((p) => expect(p.series).toHaveLength(2));
    expect(lerato!.preview.summary).toMatch(/\d+\.\d/);
  });
});
