package com.safetrace.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SafetyCheck {
    private Long checkId;
    private Long requesterId;
    private Long targetMemberId;
    private Long incidentId;       // 특정 사건과 연결된 요청이면 값 있음, 일반 요청이면 null
    private String status;         // PENDING / SAFE / HELP
    private String token;
    private LocalDateTime tokenExpiresAt;
    private LocalDateTime requestedAt;
    private LocalDateTime confirmedAt;

    // 화면 표시용 조인 결과 필드 (DB 컬럼 아님)
    private String requesterName;
    private String targetMemberName;
    private String incidentTitle;
}
