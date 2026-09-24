// Run on local, explicitly selected fixtures. Nothing is sent to an external provider.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { correctPhoto } from '../image.mjs';
const directory=process.argv[2];if(!directory)throw new Error('Usage: node scripts/quality-check.mjs <fixture-directory>');
const cases=[['astronaut.png','portrait','natural'],['coffee.png','product','clean'],['coffee.png','space','food']];
const rows=[],tiles=[];
for(const [name,category,preset] of cases){const input=await readFile(resolve(directory,name)),times=[];let result;
  for(let n=0;n<6;n++){const started=performance.now();result=await correctPhoto(input,{category,preset,strength:60});times.push(performance.now()-started);}
  const original=await sharp(result.original).removeAlpha().raw().toBuffer(),output=await sharp(result.output).removeAlpha().raw().toBuffer();let difference=0,beforeClipped=0,afterClipped=0;
  for(let n=0;n<output.length;n++){difference+=Math.abs(original[n]-output[n]);if(original[n]===255)beforeClipped++;if(output[n]===255)afterClipped++;}
  const stem=`${category}-${preset}`;await writeFile(resolve(directory,`${stem}-output.png`),result.output);
  rows.push({fixture:name,category,preset,width:result.width,height:result.height,outputBytes:result.output.length,medianMs:times.slice(1).sort((a,b)=>a-b)[2],meanAbsoluteChannelChange:difference/output.length,clippedChannelFractionBefore:beforeClipped/output.length,clippedChannelFractionAfter:afterClipped/output.length});
  for(const bytes of [result.original,result.output])tiles.push(await sharp(bytes).resize(400,300,{fit:'contain',background:'#eeeeee'}).png().toBuffer());
}
const sheet=await sharp({create:{width:800,height:900,channels:3,background:'#eeeeee'}}).composite(tiles.map((input,n)=>({input,left:(n%2)*400,top:Math.floor(n/2)*300}))).png().toBuffer();
await writeFile(resolve(directory,'comparison.png'),sheet);await writeFile(resolve(directory,'metrics.json'),JSON.stringify({engine:'sharp local; not AI model validation',rows},null,2));console.log(JSON.stringify(rows,null,2));
