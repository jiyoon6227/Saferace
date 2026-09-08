package com.safetrace.service;

import com.safetrace.domain.FamilyRelation;
import com.safetrace.domain.Member;
import com.safetrace.mapper.FamilyRelationMapper;
import com.safetrace.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FamilyRelationService {

    private final FamilyRelationMapper familyRelationMapper;
    private final MemberMapper memberMapper;

    // 로그인ID로 상대방을 정확히 찾아 가족 등록 요청(PENDING) 생성
    public void sendRequest(Long memberId, String targetLoginId, String relationType) {
        Member target = memberMapper.findByLoginId(targetLoginId);
        if (target == null) {
            throw new IllegalArgumentException("존재하지 않는 아이디입니다.");
        }
        if (target.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("본인은 가족으로 등록할 수 없습니다.");
        }

        boolean alreadyRelated =
                familyRelationMapper.findSentByMemberId(memberId).stream()
                        .anyMatch(r -> r.getFamilyMemberId().equals(target.getMemberId()))
                || familyRelationMapper.findAcceptedFamilies(memberId).stream()
                        .anyMatch(r -> r.getFamilyMemberId().equals(target.getMemberId()));
        if (alreadyRelated) {
            throw new IllegalArgumentException("이미 요청했거나 가족으로 등록된 회원입니다.");
        }

        FamilyRelation relation = new FamilyRelation();
        relation.setMemberId(memberId);
        relation.setFamilyMemberId(target.getMemberId());
        relation.setRelationType(relationType != null && !relationType.isBlank() ? relationType : "가족");
        familyRelationMapper.insert(relation);
    }

    public List<FamilyRelation> getSentRequests(Long memberId) {
        return familyRelationMapper.findSentByMemberId(memberId);
    }

    public List<FamilyRelation> getReceivedRequests(Long memberId) {
        return familyRelationMapper.findReceivedByMemberId(memberId);
    }

    public List<FamilyRelation> getAcceptedFamilies(Long memberId) {
        return familyRelationMapper.findAcceptedFamilies(memberId);
    }

    // 요청을 받은 사람(FAMILY_MEMBER_ID)만 수락할 수 있음
    public void accept(Long relationId, Long currentMemberId) {
        FamilyRelation relation = findReceivedRelationOrThrow(relationId, currentMemberId);
        if (!"PENDING".equals(relation.getStatus())) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
        familyRelationMapper.accept(relationId);
    }

    // 요청자/수신자 둘 중 누구든 관계를 끊을 수 있음
    public void delete(Long relationId, Long currentMemberId) {
        boolean isParty =
                familyRelationMapper.findSentByMemberId(currentMemberId).stream()
                        .anyMatch(r -> r.getRelationId().equals(relationId))
                || familyRelationMapper.findReceivedByMemberId(currentMemberId).stream()
                        .anyMatch(r -> r.getRelationId().equals(relationId))
                || familyRelationMapper.findAcceptedFamilies(currentMemberId).stream()
                        .anyMatch(r -> r.getRelationId().equals(relationId));
        if (!isParty) {
            throw new IllegalArgumentException("본인과 관련된 가족관계만 삭제할 수 있습니다.");
        }
        familyRelationMapper.delete(relationId);
    }

    private FamilyRelation findReceivedRelationOrThrow(Long relationId, Long currentMemberId) {
        return familyRelationMapper.findReceivedByMemberId(currentMemberId).stream()
                .filter(r -> r.getRelationId().equals(relationId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("수락 권한이 없거나 존재하지 않는 요청입니다."));
    }
}