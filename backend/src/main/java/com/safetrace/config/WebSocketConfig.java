package com.safetrace.config;

import com.safetrace.websocket.IncidentWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final IncidentWebSocketHandler incidentWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // React에서는 new WebSocket("ws://localhost:8080/ws/incidents") 로 연결
        registry.addHandler(incidentWebSocketHandler, "/ws/incidents")
                .setAllowedOrigins("*"); // 개발 단계는 전체 허용, 배포 시 프론트 주소로 제한
    }
}
