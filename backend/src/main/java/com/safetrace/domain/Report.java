package com.safetrace.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Report {
    private Long reportId;
    private Long memberId;
    private String reporterName;  // 제보자 이름 (SF_MEMBER 조인 결과, STAFF 화면 표시용)
    private String disasterType;
    private String content;
    private Double latitude;
    private Double longitude;
    private String photoUrl;
    private Long incidentId;     // 연결된 Incident (없으면 null)
    private String status;
    private LocalDateTime createdAt;
}