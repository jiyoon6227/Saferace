package com.safetrace.controller;

import com.safetrace.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberService memberService;

    // body 예시: { "loginId": "test123", "password": "1234", "name": "곽지윤" }
    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody Map<String, String> body) {
        memberService.signup(body.get("loginId"), body.get("password"), body.get("name"));
        return Map.of("message", "회원가입 완료");
    }

    // body 예시: { "loginId": "test123", "password": "1234" }
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        String token = memberService.login(body.get("loginId"), body.get("password"));
        return Map.of("token", token);
    }
}