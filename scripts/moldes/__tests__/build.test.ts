import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { buildAll } from '../build';

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('buildAll', () => {
  it('gera arquivos, imagens e manifest coerentes', async () => {
    const out = await mkdtemp(join(tmpdir(), 'moldes-'));
    const ms = await buildAll(out);
    assert.deepEqual(
      ms.map((m) => m.number),
      ['001', '002', '003', '004', '005'],
    );

    for (const m of ms) {
      const manifest = JSON.parse(await readFile(join(out, m.slug, 'manifest.json'), 'utf8'));
      assert.equal(manifest.slug, m.slug);
      for (const f of m.files) {
        const bytes = await readFile(join(out, m.slug, f.fileName));
        assert.equal(sha256(bytes), f.sha256, f.fileName);
        assert.equal(bytes.byteLength, f.sizeBytes);
        assert.ok(bytes.byteLength < 30 * 1024 * 1024);
        assert.ok(f.format === 'A0' ? f.pages === 1 : f.pages >= 6, `${f.fileName}: ${f.pages}`);
      }
      assert.equal(m.images.length, 3);
      for (const image of m.images) {
        const png = await readFile(join(out, m.slug, image.fileName));
        assert.equal(png.readUInt32BE(16), 900);
        assert.equal(png.readUInt32BE(20), 1200);
      }
    }

    const gode = ms[0];
    assert.equal(gode.priceCents, 0);
    assert.deepEqual(
      gode.files.map((f) => f.fileName),
      ['saia-gode-inteira-a4.pdf', 'saia-gode-inteira-a0.pdf', 'saia-gode-meia-a4.pdf', 'saia-gode-meia-a0.pdf'],
    );
    assert.deepEqual(
      ms.find((m) => m.slug === 'bolsa-tote')!.files.map((f) => f.format),
      ['A4'],
    );
    assert.match(gode.yardage, /godê inteiro: PP \d,\d\d m/);
    assert.match(ms[1].yardage, /^PP \d,\d\d m · P /);
  });
});
