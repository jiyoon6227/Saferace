package com.safetrace.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Member {
    private Long memberId;
    private String loginId;
    private String password;   // BCrypt 암호화된 값
    private String name;
    private String role;       // USER / STAFF / ADMIN
    private LocalDateTime createdAt;
}