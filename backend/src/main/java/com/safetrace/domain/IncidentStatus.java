package com.safetrace.domain;

/**
 * Incident 워크플로우 6단계
 * 발생(RECEIVED) → 접수 → 확인중 → 대응중 → 복구중 → 종료
 * 각 상태는 "다음으로 갈 수 있는 상태"를 스스로 알고 있게 해서
 * 서비스 로직이 아니라 enum 자체가 규칙을 갖도록 설계함
 */
public enum IncidentStatus {
    RECEIVED("접수"),
    CONFIRMING("확인중"),
    RESPONDING("대응중"),
    RECOVERING("복구중"),
    CLOSED("종료");

    private final String label;

    IncidentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * 현재 상태에서 targetStatus로 전이가 가능한지 검사
     * - 단계를 건너뛸 수 없음 (RECEIVED -> RESPONDING 같은 skip 금지)
     * - 역행은 허용하지 않음 (CLOSED -> RECEIVED 같은 되돌리기 금지)
     */
    public boolean canTransitionTo(IncidentStatus target) {
        IncidentStatus[] order = values();
        int currentIdx = this.ordinal();
        int targetIdx = target.ordinal();
        // 바로 다음 단계로만 이동 허용
        return targetIdx == currentIdx + 1;
    }
}
