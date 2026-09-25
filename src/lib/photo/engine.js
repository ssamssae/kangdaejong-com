import { catalog, validateOptions } from '../../../photo-app/catalog.mjs';

// Inspect dimensions before browser decoding so compressed large images are rejected early.
export function dimensions(buffer) {
  const b=new Uint8Array(buffer),v=new DataView(buffer),tag=(i,n)=>String.fromCharCode(...b.slice(i,i+n));
  const fail=()=>{throw new Error('움직이지 않는 JPG·PNG·WebP 사진을 선택해주세요.');};
  let width,height;
  if(b.length>=24&&tag(1,3)==='PNG'&&b[0]===137){
    if(tag(12,4)!=='IHDR')fail();width=v.getUint32(16);height=v.getUint32(20);
    for(let p=8;p+12<=b.length;){const size=v.getUint32(p);if(tag(p+4,4)==='acTL')fail();if(size>b.length-p-12)fail();p+=size+12;}
  }else if(b[0]===255&&b[1]===216){
    for(let p=2;p+3<b.length;){if(b[p++]!==255)fail();while(b[p]===255)p++;const marker=b[p++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const size=v.getUint16(p);if(size<2||p+size>b.length)fail();if([0xc0,0xc1,0xc2].includes(marker)){if(size<7)fail();height=v.getUint16(p+3);width=v.getUint16(p+5);break;}p+=size;}
  }else if(b.length>=30&&tag(0,4)==='RIFF'&&tag(8,4)==='WEBP'){
    for(let p=12;p+8<=b.length;){const kind=tag(p,4),size=v.getUint32(p+4,true),start=p+8;if(size>b.length-start)fail();
      if(kind==='ANIM'||kind==='ANMF')fail();
      if(kind==='VP8X'&&size>=10){if(b[start]&2)fail();width=1+b[start+4]+(b[start+5]<<8)+(b[start+6]<<16);height=1+b[start+7]+(b[start+8]<<8)+(b[start+9]<<16);}
      if(kind==='VP8 '&&size>=10&&!width){if(b[start+3]!==0x9d||b[start+4]!==1||b[start+5]!==0x2a)fail();width=v.getUint16(start+6,true)&0x3fff;height=v.getUint16(start+8,true)&0x3fff;}
      if(kind==='VP8L'&&size>=5&&!width){if(b[start]!==0x2f)fail();width=1+b[start+1]+((b[start+2]&63)<<8);height=1+(b[start+2]>>6)+(b[start+3]<<2)+((b[start+4]&15)<<10);}
      p=start+size+(size%2);
    }
  }else fail();
  if(!width||!height)fail();if(width*height>catalog.maxPixels)throw new Error('사진은 2,400만 화소 이하로 선택해주세요.');return {width,height};
}
// Some browser encoders add EXIF. Keep only PNG image/color chunks in downloads.
export async function stripMetadata(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer),parts=[bytes.subarray(0,8)],allowed=new Set(['IHDR','PLTE','tRNS','IDAT','IEND','sRGB','gAMA','cHRM']);
  for(let p=8;p+12<=bytes.length;){const length=view.getUint32(p),end=p+length+12;if(end>bytes.length)throw new Error('결과 사진을 저장하지 못했습니다.');const type=String.fromCharCode(...bytes.subarray(p+4,p+8));if(allowed.has(type))parts.push(bytes.subarray(p,end));p=end;}
  return new Blob(parts,{type:'image/png'});
}
const looks={portrait:{natural:[.05,0],soft:[.07,-.05],bright:[.15,.025]},product:{natural:[.03,0],clean:[.065,0],bright:[.13,0]},space:{natural:[.05,.02],food:[.06,.12],interior:[.17,.015]}};
export async function correct(file,input){
  const options=validateOptions(input);if(!file.size||file.size>catalog.maxBytes)throw new Error('사진은 장당 10MB 이하로 선택해주세요.');dimensions(await file.arrayBuffer());
  let bitmap;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('읽을 수 없는 사진입니다. 다른 JPG·PNG·WebP 파일을 선택해주세요.');}
  try{
    if(bitmap.width*bitmap.height>catalog.maxPixels)throw new Error('사진은 2,400만 화소 이하로 선택해주세요.');
    const scale=Math.min(1,catalog.maxEdge/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('이 브라우저에서 사진 보정을 사용할 수 없습니다.');
    ctx.drawImage(bitmap,0,0,width,height);const original=await stripMetadata(await canvas.convertToBlob({type:'image/png'})),pixels=ctx.getImageData(0,0,width,height),data=pixels.data,[lift,chroma]=looks[options.category][options.preset],amount=options.strength/100,saturation=1+chroma*amount;
    // Preserve alpha and geometry. Saturation uses an RGB luminance blend; sharp uses a different color model.
    for(let i=0;i<data.length;i+=4){const luminance=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];for(let c=0;c<3;c++){const value=Math.max(0,Math.min(255,luminance+(data[i+c]-luminance)*saturation));data[i+c]=Math.round(value+2*lift*amount*value*(1-value/255));}}
    ctx.putImageData(pixels,0,0);const output=await stripMetadata(await canvas.convertToBlob({type:'image/png'}));canvas.width=canvas.height=1;return{original,output,width,height};
  }finally{bitmap.close();}
}
