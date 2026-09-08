package com.safetrace.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// 회원가입 시 이메일 인증코드 발급/검증.
// 별도 DB 테이블 없이 메모리(ConcurrentHashMap)에만 임시 보관 - 서버 재시작하면 초기화됨.
// 짧은 유효시간(5분) 동안만 쓰이는 휘발성 데이터라 DB까지 갈 필요는 없다고 판단.
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final MailService mailService;

    private final Map<String, CodeEntry> codes = new ConcurrentHashMap<>();
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

    public void sendCode(String email) {
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        codes.put(email, new CodeEntry(code, LocalDateTime.now().plusMinutes(5)));
        mailService.sendVerificationCode(email, code);
    }

    public boolean verifyCode(String email, String code) {
        CodeEntry entry = codes.get(email);
        if (entry == null || entry.expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }
        if (!entry.code.equals(code)) {
            return false;
        }
        verifiedEmails.add(email);
        codes.remove(email);
        return true;
    }

    // 회원가입 시점에 실제로 인증된 이메일인지 다시 한번 확인용
    public boolean isVerified(String email) {
        return email != null && verifiedEmails.contains(email);
    }

    private record CodeEntry(String code, LocalDateTime expiresAt) {}
}