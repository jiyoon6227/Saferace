package com.safetrace.mapper;

import com.safetrace.domain.FamilyRelation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FamilyRelationMapper {
    void insert(FamilyRelation relation);
    List<FamilyRelation> findSentByMemberId(@Param("memberId") Long memberId);       // 내가 보낸 요청
    List<FamilyRelation> findReceivedByMemberId(@Param("memberId") Long memberId);   // 나한테 온 요청 (수락 대기)
    List<FamilyRelation> findAcceptedFamilies(@Param("memberId") Long memberId);     // 양쪽 다 ACCEPTED인 실제 가족 목록
    void accept(@Param("relationId") Long relationId);
    void delete(@Param("relationId") Long relationId);
}