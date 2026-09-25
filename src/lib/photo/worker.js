import { correct } from './engine.js';
self.onmessage=async({data})=>{try{self.postMessage({result:await correct(data.file,data.options)});}catch(error){self.postMessage({error:error.message||'사진을 보정하지 못했습니다.'});}};
