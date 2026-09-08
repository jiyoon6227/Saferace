package com.safetrace.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MemberRegion {
    private Long memberRegionId;
    private Long memberId;
    private String regionCode;   // 공공 API 연동용, 당장은 null 가능
    private String regionName;   // 예: 대전 유성구
    private String isPrimary;    // Y/N - 대표 관심지역
    private LocalDateTime createdAt;
}
