import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dimensions } from '../src/lib/photo/engine.js';
const sharp=createRequire(new URL('../photo-app/package.json',import.meta.url))('sharp');
const input=sharp({create:{width:120,height:80,channels:4,background:'#98765480'}});
const bufferOf=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
test('predecode bounds accept PNG, progressive JPEG and both WebP encodings',async()=>{
 for(const b of [await input.clone().png().toBuffer(),await input.clone().jpeg({progressive:true}).toBuffer(),await input.clone().webp().toBuffer(),await input.clone().webp({lossless:true}).toBuffer()])assert.deepEqual(dimensions(bufferOf(b)),{width:120,height:80});
});
test('spoofed and truncated formats fail before decode; huge dimensions are blocked',async()=>{
 for(const b of [Buffer.from('<svg/>'),Buffer.from([255,216,255,224,0,100])])assert.throws(()=>dimensions(bufferOf(b)));
 const png=await input.clone().png().toBuffer();png.writeUInt32BE(100000,16);assert.throws(()=>dimensions(bufferOf(png)),/2,400만/);
});
test('animated PNG/WebP containers cannot silently become still photos',async()=>{
 const png=await input.clone().png().toBuffer(),chunk=Buffer.alloc(20);chunk.writeUInt32BE(8,0);chunk.write('acTL',4);const animated=Buffer.concat([png.subarray(0,33),chunk,png.subarray(33)]);assert.throws(()=>dimensions(bufferOf(animated)),/움직이지/);
 const webp=Buffer.alloc(30);webp.write('RIFF');webp.writeUInt32LE(22,4);webp.write('WEBPVP8X',8);webp.writeUInt32LE(10,16);webp[20]=2;assert.throws(()=>dimensions(bufferOf(webp)),/움직이지/);
});
