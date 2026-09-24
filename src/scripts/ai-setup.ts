export function initEligibility(doc: Document) {
  const form = doc.querySelector<HTMLFormElement>('[data-eligibility]');
  if (!form) return;
  const result = doc.querySelector<HTMLElement>('#result')!;
  const title = doc.querySelector<HTMLElement>('#result-title')!;
  const text = doc.querySelector<HTMLElement>('#result-text')!;
  const inquiry = doc.querySelector<HTMLTextAreaElement>('#inquiry')!;
  const email = doc.querySelector<HTMLAnchorElement>('#email')!;
  const status = doc.querySelector<HTMLElement>('#copy-status')!;
  form.addEventListener('change', () => { result.hidden = true; inquiry.value = ''; email.removeAttribute('href'); status.textContent = ''; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const eligible = data.get('os') === 'mac' && ['codex', 'claude'].includes(String(data.get('ai'))) && ['ready', 'telegram', 'online'].every(k => data.get(k) === 'yes');
    title.textContent = eligible ? '기본 준비 조건을 확인했어요.' : '먼저 확인할 준비 사항이 있어요.';
    text.textContent = eligible ? '사전 상담을 진행할 수 있는 준비 상태입니다. 설치 가능 여부와 일정은 추가 확인이 필요하며, 구매나 예약이 확정된 것은 아닙니다.' : '이번 지원은 Mac에서 AI 도구를 이미 사용하고, 텔레그램 계정과 켜진 컴퓨터를 준비한 경우부터 검토합니다. 현재 상태를 문의해 주세요. 유료 설치 가능 판정이 아닙니다.';
    const values = Array.from(form.querySelectorAll('select')).map(select => `${select.labels?.[0]?.childNodes[0]?.textContent?.trim()}: ${select.selectedOptions[0].textContent}`);
    inquiry.value = ['[AI 연결 설치 사전상담 / 홈페이지]', ...values, '', '원하는 작업과 현재 막힌 단계: (직접 적어주세요)', 'Mac 운영체제 버전: (직접 적어주세요)', '상담 가능한 시간대: (직접 적어주세요)', '', '제안가 99,000원과 사전상담 단계임을 확인했습니다.', '비밀번호, 봇 토큰, 인증코드는 보내지 않습니다.'].join('\n');
    email.href = `mailto:minusbetastudio@gmail.com?subject=${encodeURIComponent('AI 연결 설치 사전상담')}&body=${encodeURIComponent(inquiry.value)}`;
    result.hidden = false;
    status.textContent = '';
  });
  doc.querySelector('#copy')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(inquiry.value); status.textContent = '복사했습니다. 이메일에 붙여 넣고 검토한 뒤 직접 보내주세요.'; }
    catch { inquiry.focus(); inquiry.select(); status.textContent = '자동 복사를 사용할 수 없습니다. 선택된 내용을 직접 복사해 주세요.'; }
  });
}
