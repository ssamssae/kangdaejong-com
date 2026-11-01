// 테스트 전용 preload: 네트워크 없이 live.mjs 를 돌린다. 모든 요청은 바로 실패해 「확인 못 함」으로 남는다.
globalThis.fetch=async()=>{throw new Error('offline test');};
