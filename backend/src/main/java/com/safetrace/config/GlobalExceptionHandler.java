package com.safetrace.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// 서비스단에서 던지는 IllegalArgumentException/IllegalStateException의 실제 메시지가
// 프론트(response.json().message)로 그대로 전달되게 한다.
// 이게 없으면 스프링부트 기본 동작상 예외 메시지가 응답에서 빠지고
// "회원가입에 실패했습니다" 같은 프론트 쪽 대체 문구만 보이게 됨.
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }
}