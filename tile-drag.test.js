import test from 'node:test';
import assert from 'node:assert/strict';
import {bindTileDrag} from './tile-drag.js';
import {Tabletop} from './tabletop.js';
import {createGame,claim,place} from './engine.js';
class Hand extends EventTarget {
 captures=new Set();
 setPointerCapture(id){this.captures.add(id);}
 hasPointerCapture(id){return this.captures.has(id);}
 releasePointerCapture(id){this.captures.delete(id);this.fire('lostpointercapture',{pointerId:id});}
 fire(type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:1,clientX:10,clientY:20,pointerType:'mouse',button:0,isPrimary:true},props);this.dispatchEvent(e);}
}
function fixture(){const source=new Hand(),calls=[];const cancel=bindTileDrag(source,Object.fromEntries(['start','move','drop','cancel','tap'].map(k=>[k,()=>calls.push(k)])));return {source,calls,cancel};}
test('tap or tiny movement never commits a drop',()=>{const {source,calls}=fixture();source.fire('pointerdown');source.fire('pointermove',{clientX:12});source.fire('pointerup');assert.deepEqual(calls,['tap']);});
test('mouse, touch and pen drags start once and drop once after pointer capture',()=>{for(const pointerType of ['mouse','touch','pen']){const {source,calls}=fixture();source.fire('pointerdown',{pointerType});source.fire('pointermove',{clientX:25,pointerType});source.fire('pointermove',{clientX:45,pointerType});source.fire('pointerup',{clientX:45,pointerType});source.fire('pointerup');assert.deepEqual(calls,['start','move','move','drop']);assert.equal(source.captures.size,0);}});
test('cancelled or lost capture never places a tile',()=>{for(const event of ['pointercancel','lostpointercapture']){const {source,calls}=fixture();source.fire('pointerdown');source.fire('pointermove',{clientY:45});source.fire(event);source.fire('pointerup');assert.deepEqual(calls,['start','move','cancel']);}});
test('Escape cancellation and unrelated pointer do not trigger drop',()=>{const {source,calls,cancel}=fixture();source.fire('pointerdown');source.fire('pointermove',{pointerId:2,clientY:100});source.fire('pointerup',{pointerId:2});cancel();source.fire('pointerup');assert.deepEqual(calls,['cancel']);});
test('drag hit testing rejects occupied squares, other players and HUD; valid release can place',()=>{const game=createGame(['A','B'],()=>.5);while(game.phase==='draft')claim(game,game.market.find(d=>d.owner===null).id);const canvas={getBoundingClientRect:()=>({left:0,top:0})};const table={canvas,state:{game,rotation:0},world:(x,y)=>({x,y}),draw(){}};globalThis.document={elementFromPoint:()=>canvas};const offset=game.active*600;assert.match(Tabletop.prototype.dragAt.call(table,offset+216,216).error,/occupied/);assert.equal(Tabletop.prototype.dragAt.call(table,offset+264,216).error,null);const touch=Tabletop.prototype.dragAt.call(table,offset+264,270,'touch');assert.equal(touch.target.x,1);assert.equal(touch.target.y,0);assert.ok(Tabletop.prototype.dragAt.call(table,(1-game.active)*600+264,216).error);globalThis.document.elementFromPoint=()=>({});assert.ok(Tabletop.prototype.dragAt.call(table,offset+264,216).error);globalThis.document.elementFromPoint=()=>canvas;const target=Tabletop.prototype.dragAt.call(table,offset+264,216).target;place(game,target.x,target.y,0);assert.equal(game.phase,'claim');delete globalThis.document;});
