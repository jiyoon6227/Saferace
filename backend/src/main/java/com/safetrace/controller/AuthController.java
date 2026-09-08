package com.safetrace.controller;

import com.safetrace.service.EmailVerificationService;
import com.safetrace.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberService memberService;
    private final EmailVerificationService emailVerificationService;

    // body 예시: { "loginId": "test123", "password": "1234", "name": "곽지윤", "email": "a@b.com" }
    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody Map<String, String> body) {
        memberService.signup(body.get("loginId"), body.get("password"), body.get("name"), body.get("email"));
        return Map.of("message", "회원가입 완료");
    }

    // body 예시: { "loginId": "test123", "password": "1234" }
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        String token = memberService.login(body.get("loginId"), body.get("password"));
        return Map.of("token", token);
    }

    // 회원가입 - 이메일 인증코드 발송. body 예시: { "email": "a@b.com" }
    @PostMapping("/email/send-code")
    public Map<String, String> sendVerificationCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        if (memberService.isEmailTaken(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        emailVerificationService.sendCode(email);
        return Map.of("message", "인증번호를 발송했습니다.");
    }

    // 회원가입 - 이메일 인증코드 확인. body 예시: { "email": "a@b.com", "code": "123456" }
    @PostMapping("/email/verify-code")
    public Map<String, String> verifyCode(@RequestBody Map<String, String> body) {
        boolean ok = emailVerificationService.verifyCode(body.get("email"), body.get("code"));
        if (!ok) {
            throw new IllegalArgumentException("인증번호가 올바르지 않거나 만료되었습니다.");
        }
        return Map.of("message", "이메일 인증이 완료되었습니다.");
    }
}