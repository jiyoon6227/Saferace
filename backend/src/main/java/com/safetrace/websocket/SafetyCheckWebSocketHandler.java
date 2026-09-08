package com.safetrace.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safetrace.domain.SafetyCheck;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// IncidentWebSocketHandler와 동일한 방식: 접속한 모든 클라이언트에게 broadcast 하고,
// "이 알림이 나한테 온 건지"는 프론트에서 targetMemberId/requesterId를 보고 걸러낸다.
// (지금 프로젝트에 세션별 로그인 사용자 식별 구조가 없어서, Incident 쪽과 동일한 수준으로 맞춤)
@Component
@RequiredArgsConstructor
public class SafetyCheckWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
    }

    public void broadcastRequested(SafetyCheck check) {
        broadcast(Map.of(
                "eventType", "SAFETY_CHECK_REQUESTED",
                "safetyCheck", check
        ));
    }

    public void broadcastResponded(SafetyCheck check) {
        broadcast(Map.of(
                "eventType", "SAFETY_CHECK_RESPONDED",
                "safetyCheck", check
        ));
    }

    private void broadcast(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            TextMessage message = new TextMessage(json);

            for (WebSocketSession session : sessions.values()) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
        } catch (IOException e) {
            System.err.println("SafetyCheck WebSocket broadcast 실패: " + e.getMessage());
        }
    }
}
