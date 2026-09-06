package com.safetrace.mapper;

import com.safetrace.domain.Member;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MemberMapper {
    void insert(Member member);
    Member findByLoginId(String loginId);
}