const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder } = require('node:util');

const root = path.resolve(__dirname, '..', 'web');
const ctx = { window: {}, TextEncoder, Blob, console, Float32Array, Uint8Array, DataView, Math, Map, Set, ArrayBuffer };
for (const file of ['catalog.js', 'snap.js', 'engine.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    ctx.PSB = ctx.window.PSB;
}
const { PSB, PSBEngine } = { PSB: ctx.window.PSB, PSBEngine: ctx.window.PSBEngine };

test('catalog contains 68 module types including 30 thin modules', () => {
    assert.equal(PSB.modules.length, 68);
    assert.equal(PSB.modules.filter(m => m.thin).length, 30);
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

test('thin cladding is 5-15 cm thick and advanced hull shapes are separate meshes', () => {
    assert.equal(PSB.byId.skin05.dim[1], .05);
    assert.equal(PSB.byId.skin2.dim[1], .12);
    assert.equal(PSB.byId.armor15.dim[1], .15);
    for (const id of ['taper', 'triangle', 'bevel']) {
        const tris = PSBEngine.triangles([{ id: 1, type: ({ taper: 'nose2', triangle: 'tri2', bevel: 'bevel2' })[id], x: 0, y: 0, z: 0, yaw: 0, color: '#ffffff' }]);
        assert.ok(tris.length >= 8, id);
        assert.ok(tris.every(t => t.p.flat().every(Number.isFinite)), id);
    }
    for (const id of ['doorframeThin', 'windowframeThin']) {
        assert.ok(PSBEngine.triangles([{ id: 1, type: id, x: 0, y: 0, z: 0, yaw: 0, color: '#ffffff' }]).length > 20, id);
    }
});

test('precise face snapping handles 50 mm modules and rotated side panels', () => {
    const snap = ctx.window.PSBSnap;
    const bottom = { type: 'skin05', yaw: 0, x: 0, y: 0, z: 0 };
    const top = { type: 'skin1', yaw: 0, x: 0, y: .085, z: 0 };
    assert.ok(Math.abs(snap.facePosition(bottom, top, 'py')[1] - .085) < .00001);
    assert.equal(snap.intersects(bottom, top), false);
    assert.equal(snap.intersects(bottom, { ...top, y: .06 }), true);
    const parent = { type: 'side4', yaw: 90, x: 0, y: 0, z: 0 };
    const added = { type: 'side2', yaw: 90 };
    const [x, y, z] = snap.facePosition(parent, added, 'px');
    assert.equal(x, .12);
    assert.equal(y, 0);
    assert.equal(z, 0);
});
