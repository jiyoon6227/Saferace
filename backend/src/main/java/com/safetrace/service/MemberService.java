package com.safetrace.service;

import com.safetrace.config.JwtTokenProvider;
import com.safetrace.domain.Member;
import com.safetrace.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void signup(String loginId, String rawPassword, String name) {
        if (memberMapper.findByLoginId(loginId) != null) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        Member member = new Member();
        member.setLoginId(loginId);
        member.setPassword(passwordEncoder.encode(rawPassword));
        member.setName(name);
        member.setRole("USER");

        memberMapper.insert(member);
    }

    public String login(String loginId, String rawPassword) {
        Member member = memberMapper.findByLoginId(loginId);

        if (member == null || !passwordEncoder.matches(rawPassword, member.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        return jwtTokenProvider.generateToken(member.getMemberId(), member.getRole());
    }
}
