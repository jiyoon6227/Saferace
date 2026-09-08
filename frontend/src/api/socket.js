const WS_URL = "ws://localhost:8080/ws/incidents";
const SAFETY_CHECK_WS_URL = "ws://localhost:8080/ws/safety-check";

// 백엔드 IncidentWebSocketHandler에 연결해서, 메시지 올 때마다 onMessage로 넘겨줌.
// 연결이 실패해도 화면 기능 자체는 (새로고침하면) 정상 동작하니, 에러는 콘솔에만 남기고 조용히 넘어감.
export function connectIncidentSocket(onMessage) {
  const socket = new WebSocket(WS_URL);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // 파싱 안 되는 메시지는 무시
    }
  };

  socket.onerror = () => {
    console.warn("WebSocket 연결 실패 - 실시간 갱신 없이 동작합니다. (새로고침하면 최신 상태로 보임)");
  };

  return socket;
}

// 가족 안전확인용 - SafetyCheckWebSocketHandler에 연결.
// eventType이 SAFETY_CHECK_REQUESTED / SAFETY_CHECK_RESPONDED로 옴 (백엔드는 전체 broadcast라
// "나랑 관련된 알림인지"는 onMessage 쪽에서 requesterId/targetMemberId로 걸러야 함)
export function connectSafetyCheckSocket(onMessage) {
  const socket = new WebSocket(SAFETY_CHECK_WS_URL);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // 파싱 안 되는 메시지는 무시
    }
  };

  socket.onerror = () => {
    console.warn("안전확인 WebSocket 연결 실패 - 실시간 갱신 없이 동작합니다.");
  };

  return socket;
}