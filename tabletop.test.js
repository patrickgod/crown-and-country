import test from 'node:test';
import assert from 'node:assert/strict';
import {boardHit,origin,Tabletop} from './tabletop.js';
test('canvas picking distinguishes four kingdoms and board edges',()=>{for(let id=0;id<4;id++){const o=origin(id);assert.deepEqual(boardHit(o.x+216,o.y+216,4),{id,x:0,y:0});assert.equal(boardHit(o.x+432,o.y+216,4),null);}assert.equal(boardHit(-1,0,4),null);assert.equal(boardHit(601,1,1),null);});
test('zoom keeps the world under a fingertip fixed and clamps scale',()=>{const table={w:390,h:844,centerY:420,camera:{x:216,y:216,z:1},draw(){},world:Tabletop.prototype.world};const before=table.world(90,300);Tabletop.prototype.zoom.call(table,1.8,90,300);assert.ok(Math.abs(table.world(90,300).x-before.x)<1e-8);assert.ok(Math.abs(table.world(90,300).y-before.y)<1e-8);Tabletop.prototype.zoom.call(table,100);assert.equal(table.camera.z,2.8);Tabletop.prototype.zoom.call(table,.0001);assert.equal(table.camera.z,.16);});
