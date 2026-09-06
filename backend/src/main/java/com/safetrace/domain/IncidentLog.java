package com.safetrace.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class IncidentLog {
    private Long logId;
    private Long incidentId;
    private String prevStatus;
    private String newStatus;
    private String memo;         // 조치사항 (예: "도로 통제 완료")
    private Long changedBy;      // 담당자 ID
    private LocalDateTime changedAt;
}
