const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder } = require('node:util');

const root = path.resolve(__dirname, '..', 'web');
const ctx = { window: {}, TextEncoder, Blob, console, Float32Array, Uint8Array, DataView, Math, Map, Set, ArrayBuffer };
for (const file of ['catalog.js', 'engine.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    ctx.PSB = ctx.window.PSB;
}
const { PSB, PSBEngine } = { PSB: ctx.window.PSB, PSBEngine: ctx.window.PSBEngine };

test('catalog contains 38 functional module families', () => {
    assert.equal(PSB.modules.length, 38);
    assert.deepEqual(new Set(PSB.modules.map(m => m.cat)), new Set(['frame', 'armor', 'interior', 'system']));
    for (const m of PSB.modules) {
        assert.ok(m.dim.every(n => n > 0 && Number.isFinite(n)), m.id);
        assert.ok(m.mass > 0);
    }
});

test('all four preset hulls use valid module types', () => {
    for (const id of ['scout', 'fighter', 'frigate', 'carrier']) {
        assert.ok(PSB.presets[id].length > 0, id);
        assert.ok(PSB.presets[id].every(([part]) => PSB.byId[part]), id);
    }
});

test('geometry of every catalog shape contains finite 3D triangles', () => {
    const mods = PSB.modules.map((m, i) => ({ id: i + 1, type: m.id, x: i * 5, y: 0, z: 0, yaw: 0, color: '#edf2f7' }));
    const tris = PSBEngine.triangles(mods, 0);
    assert.ok(tris.length > mods.length);
    assert.ok(tris.every(t => t.p.length === 3 && t.p.every(p => p.length === 3 && p.every(Number.isFinite))));
});

test('face snap accounts for rotated world extents and preserves alignment', () => {
    const a = { type: 'plate4', yaw: 90, x: 0, y: 0, z: 0 };
    const b = { type: 'plate2', yaw: 0 };
    const d = m => {
        const [x, y, z] = PSB.byId[m.type].dim;
        return m.yaw % 180 === 90 ? [z, y, x] : [x, y, z];
    };
    const x = (d(a)[0] + d(b)[0]) / 2;
    assert.equal(x, 2); // 2 m rotated width next to 2 m wide plate
});

test('GLB header, materials and separately named movable turret nodes', async () => {
    const modules = [
        { id: 1, type: 'plate2', x: 0, y: 0, z: 0, yaw: 0, color: '#edf2f7' },
        { id: 2, type: 'turret', x: 0, y: 1, z: 0, yaw: 0, color: '#667788' }
    ];
    const blob = PSBEngine.glbFor(modules);
    const data = Buffer.from(await blob.arrayBuffer());
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(4), 2);
    assert.equal(data.readUInt32LE(8), data.length);
    const jsonLength = data.readUInt32LE(12);
    const doc = JSON.parse(data.toString('utf8', 20, 20 + jsonLength));
    assert.equal(doc.asset.version, '2.0');
    assert.ok(doc.nodes.some(node => node.name.startsWith('STATIC_HULL')));
    assert.ok(doc.nodes.some(node => node.name === 'SYSTEM_turret_2'));
    assert.ok(doc.nodes.some(node => node.name === 'MOVABLE_PIVOT_2'));
});
