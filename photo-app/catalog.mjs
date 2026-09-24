export const categories = {
  portrait: { name: '인물 · 셀카', description: '내 모습은 그대로, 빛과 피부 톤은 편안하게.', presets: { natural: '자연스럽게', soft: '부드럽게', bright: '화사하게' } },
  product: { name: '쇼핑몰 상품', description: '색과 형태를 존중하는, 단정한 상품사진.', presets: { natural: '원색 중심', clean: '깔끔하게', bright: '밝게' } },
  space: { name: '음식 · 숙소', description: '맛과 공간의 분위기를 있는 그대로.', presets: { natural: '자연스럽게', food: '음식 생기', interior: '실내 밝게' } },
};
export const plans = [
  { id: 'free', name: '무료 체험', price: 0, credits: 3, period: '처음 한 번' },
  { id: 'pack', name: '충전팩', price: 4900, credits: 30, period: '한 번 충전' },
  { id: 'pro', name: '프로', price: 19900, credits: 150, period: '매월' },
];
export const catalog = { categories, plans, salesEnabled: false, generatedEditingEnabled: false, basicCost: 1, generatedCostDraft: [3, 5], maxBytes: 10 * 1024 * 1024, maxPixels: 24_000_000, maxEdge: 2400, retentionDays: 7, pricingStatus: 'draft' };
export function validateOptions(input) {
  const { category, preset, strength } = input;
  if (!Object.hasOwn(categories, category ?? '') || !Object.hasOwn(categories[category].presets, preset ?? '') || !Number.isInteger(strength) || strength < 1 || strength > 100) {
    throw Object.assign(new Error('카테고리·스타일·강도를 확인해주세요.'), { status: 400 });
  }
  return { category, preset, strength };
}
