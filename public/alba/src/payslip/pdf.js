// 그림 한 장(RGB, zlib 압축)을 A4 한 쪽에 꽉 채운 PDF 를 바이트로 만든다. 외부 패키지 없음.
// 구조: 카탈로그 · 쪽 목록 · 쪽 1개 · 그림(XObject, FlateDecode) · 그리기 명령 · 문서 정보(제목) + 교차 참조표.

const enc = new TextEncoder();

/** PDF 글자열: 한글 제목은 UTF-16BE 16진 <FEFF…> */
export function pdfText(s) {
  let hex = 'FEFF';
  for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
  return `<${hex}>`;
}

/** PDF 날짜 (D:YYYYMMDDHHmmSS+09'00') — 현지 시각 + 시간대(빼면 읽는 쪽이 UTC 로 봄) */
export function pdfDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const tz = `${off >= 0 ? '+' : '-'}${p(Math.floor(Math.abs(off) / 60))}'${p(Math.abs(off) % 60)}'`;
  return `(D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${tz})`;
}

const num = (n) => String(Math.round(n * 100) / 100);

/**
 * @param {{ width:number, height:number, data:Uint8Array, pageW?:number, pageH?:number, title?:string, created?:Date }} o
 *   width·height = 그림 화소 수, data = RGB 8비트 화소를 zlib(deflate) 로 압축한 바이트
 * @returns {Uint8Array}
 */
export function imagePdf({ width, height, data, pageW = 595.28, pageH = 841.89, title = '', created = new Date() }) {
  const parts = [];
  const offsets = [];
  let size = 0;
  const push = (chunk) => {
    const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
    parts.push(b);
    size += b.length;
  };
  const obj = (n, body) => {
    offsets[n] = size;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  const draw = `q ${num(pageW)} 0 0 ${num(pageH)} 0 0 cm /Im0 Do Q\n`;

  push('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // 이진 파일 표시 줄(%âãÏÓ)
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pageW)} ${num(pageH)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = size;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>\nstream\n`);
  push(data);
  push('\nendstream\nendobj\n');
  obj(5, `<< /Length ${enc.encode(draw).length} >>\nstream\n${draw}endstream`);
  obj(6, `<< /Title ${pdfText(title)} /Producer (alba-pay-web) /CreationDate ${pdfDate(created)} >>`);

  const xref = size;
  let table = `xref\n0 7\n0000000000 65535 f \n`;
  for (let n = 1; n <= 6; n++) table += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const b of parts) { out.set(b, at); at += b.length; }
  return out;
}
