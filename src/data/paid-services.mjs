// Public introductions live on the company site. Transactions retain the
// existing service origin, payment callbacks and browser-saved order records.
export const paidServices = [
  {
    slug:'cheotireum', name:'첫이름', kicker:'아기 이름 짓기',
    description:'아기 이름의 소리와 뜻을 살펴 가족이 함께 고르는 작명 리포트예요.',
    details:['이름 후보와 한자 뜻풀이를 한 부의 작명서로 확인해요.','사주·오행·획수 비교와 이름의 발음·영문 표기를 함께 살펴봐요.','결과를 PDF로 저장해 가족과 함께 볼 수 있어요.'],
    action:'무료로 오행 미리보기', start:'https://cheotireum.kangdaejong.com/?src=kdj-service#/form',
    sample:'https://cheotireum.kangdaejong.com/sample-report?src=kdj-service-sample', sampleLabel:'작명서 샘플 보기',
    notice:'부족한 오행을 무료로 먼저 살펴보고, 작명서(1,000원)의 제공 내용을 확인한 뒤 결제할 수 있어요.',
    saved:'이미 받은 작명서는 기존 결과 링크에서 확인해 주세요.',
    policies:[['이용약관','terms.html'],['개인정보처리방침','privacy.html'],['환불정책','refund.html']],
  },
  {
    slug:'sangho', name:'한장상호', kicker:'가게 이름 짓기',
    description:'가게를 처음 여는 사람을 위한 상호 제안이에요.',
    details:['업종과 원하는 느낌을 입력해요.','사장님의 사주를 함께 살펴 상호 후보를 골라요.','상호 후보를 한 장으로 받아봐요.'],
    action:'상호 한 장 받기', start:'https://sangho.kangdaejong.com/checkout.html',
    notice:'서비스 화면에서 입력 내용과 가격을 확인한 뒤 결제할 수 있어요.',
    saved:'기존 주문은 주문할 때 사용한 서비스 화면과 결과 링크에서 확인해 주세요.',
    policies:[],
  },
  {
    slug:'tojeong', name:'천원 토정비결', kicker:'올해 운세',
    description:'전통 토정비결에서 영감을 받은 AI 연간 운세예요. 한 해의 총운과 열두 달의 흐름을 읽어보세요.',
    details:['한 해의 총운과 분야별 흐름을 읽어요.','열두 달의 이야기를 차례로 살펴봐요.','먼저 공개 예시에서 풀이의 구성을 확인할 수 있어요.'],
    action:'입력 화면 열기', start:'https://tojeong.kangdaejong.com/#start',
    sample:'https://tojeong.kangdaejong.com/example', sampleLabel:'풀이 예시 보기',
    notice:'현재 테스트 결제를 제공해요. 실제 판매는 준비 중이에요.',
    saved:'기존 풀이를 보려면 주문할 때 사용한 브라우저에서 내 풀이를 열어 주세요.',
    history:'https://tojeong.kangdaejong.com/readings', historyLabel:'내 풀이 열기',
    policies:[['이용약관','terms'],['개인정보처리방침','privacy'],['취소·환불 안내','refund']],
  },
];
