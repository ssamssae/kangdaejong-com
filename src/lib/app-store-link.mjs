// T-261117-097: 홈페이지에서 들어온 설치를 App Store Connect 앱 분석에서 세도록 캠페인 표식을 붙인다.
// pt = 개발자 계정(Minus Beta Studio) 제공자 번호, ct = 이 사이트 몫 채널 이름, mt = 8(앱).
export const OUR_APP_IDS = [
  '6762068073', '6764308678', '6816725770', '6812609143', '6769037337', '6766556759', '6765536777',
  '6765536616', '6762100639', '6762072499', '6820080312', '6766077265', '6811111727',
];
export function appStoreUrl(appId) {
  const id = String(appId);
  if (!/^\d+$/.test(id)) throw Error(`App Store app id must be digits only: ${appId}`);
  return `https://apps.apple.com/kr/app/id${id}?pt=128771490&ct=homepage&mt=8`;
}
