package com.safetrace.service;

import com.safetrace.domain.Incident;
import com.safetrace.domain.Member;
import com.safetrace.domain.SafetyCheck;
import com.safetrace.mapper.IncidentMapper;
import com.safetrace.mapper.MemberMapper;
import com.safetrace.mapper.SafetyCheckMapper;
import com.safetrace.websocket.SafetyCheckWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SafetyCheckService {

    private final SafetyCheckMapper safetyCheckMapper;
    private final MemberMapper memberMapper;
    private final IncidentMapper incidentMapper;
    private final MailService mailService;
    private final SafetyCheckWebSocketHandler webSocketHandler;

    @Value("${app.safety-check-token-expiry-hours}")
    private long tokenExpiryHours;

    // 안전확인 요청 생성. targetMemberIds 여러 명이면 한 명당 한 행씩 만들고,
    // 이메일 알림 설정이 켜져있고 이메일이 등록된 대상에게는 메일도 같이 보낸다.
    // incidentId는 null이면 일반 요청, 값이 있으면 특정 사건과 연결된 요청.
    public void requestSafetyCheck(Long requesterId, List<Long> targetMemberIds, Long incidentId) {
        Member requester = memberMapper.findById(requesterId);

        String incidentTitle = null;
        if (incidentId != null) {
            Incident incident = incidentMapper.findById(incidentId);
            incidentTitle = incident != null ? incident.getTitle() : null;
        }

        for (Long targetId : targetMemberIds) {
            Member target = memberMapper.findById(targetId);
            if (target == null) continue;

            SafetyCheck check = new SafetyCheck();
            check.setRequesterId(requesterId);
            check.setTargetMemberId(targetId);
            check.setIncidentId(incidentId);
            check.setToken(UUID.randomUUID().toString());
            check.setTokenExpiresAt(LocalDateTime.now().plusHours(tokenExpiryHours));

            safetyCheckMapper.insert(check);

            // 사이트에 접속 중인 사람에게는 실시간 알림
            webSocketHandler.broadcastRequested(check);

            // 이메일 알림 설정이 켜져있고 이메일이 등록되어 있으면 메일 발송
            // (메일 발송 실패가 전체 요청을 망치지 않도록 개별적으로 예외를 잡음)
            if ("Y".equals(target.getEmailNotifyEnabled()) && target.getEmail() != null) {
                try {
                    mailService.sendSafetyCheckRequest(
                            target.getEmail(), requester.getName(), incidentTitle, check.getToken());
                } catch (Exception e) {
                    System.err.println("안전확인 이메일 발송 실패 (targetId=" + targetId + "): " + e.getMessage());
                }
            }
        }
    }

    public List<SafetyCheck> getSentRequests(Long requesterId) {
        return safetyCheckMapper.findSentByRequesterId(requesterId);
    }

    public List<SafetyCheck> getReceivedRequests(Long targetMemberId) {
        return safetyCheckMapper.findReceivedByTargetId(targetMemberId);
    }

    // 로그인 상태(사이트 접속 중)에서 응답
    public void respond(Long checkId, String status, Long currentMemberId) {
        validateStatus(status);
        SafetyCheck check = getReceivedOrThrow(checkId, currentMemberId);
        if (!"PENDING".equals(check.getStatus())) {
            throw new IllegalStateException("이미 응답한 요청입니다.");
        }
        safetyCheckMapper.respond(checkId, status);
        check.setStatus(status);
        webSocketHandler.broadcastResponded(check);
    }

    // 이메일 링크로 응답 (비로그인). 토큰 유효성 + 만료 + 재사용 여부를 여기서 전부 검사한다.
    public void respondByToken(String token, String status) {
        validateStatus(status);
        SafetyCheck check = safetyCheckMapper.findByToken(token);
        if (check == null) {
            throw new IllegalArgumentException("유효하지 않은 링크입니다.");
        }
        if (check.getConfirmedAt() != null) {
            throw new IllegalStateException("이미 응답이 완료된 링크입니다.");
        }
        if (check.getTokenExpiresAt() != null && check.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("만료된 링크입니다. 로그인 후 다시 응답해주세요.");
        }

        safetyCheckMapper.respondByToken(token, status);
        check.setStatus(status);
        webSocketHandler.broadcastResponded(check);
    }

    private SafetyCheck getReceivedOrThrow(Long checkId, Long currentMemberId) {
        return safetyCheckMapper.findReceivedByTargetId(currentMemberId).stream()
                .filter(c -> c.getCheckId().equals(checkId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("응답 권한이 없거나 존재하지 않는 요청입니다."));
    }

    private void validateStatus(String status) {
        if (!"SAFE".equals(status) && !"HELP".equals(status)) {
            throw new IllegalArgumentException("status는 SAFE 또는 HELP만 가능합니다.");
        }
    }
}