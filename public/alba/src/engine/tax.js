// 세금 3.3% = 소득세 3%(10원 미만 절사) + 지방소득세(소득세의 10%, 10원 미만 절사)

export function withholding(gross, on = true) {
  if (!on || gross <= 0) return { incomeTax: 0, localTax: 0 };
  const incomeTax = Math.floor((gross * 3) / 1000) * 10;
  const localTax = Math.floor(incomeTax / 100) * 10;
  return { incomeTax, localTax };
}
