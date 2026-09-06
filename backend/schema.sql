-- ============================================
-- 재난 사건(Incident) 관련 테이블
-- ============================================

-- 재난 사건 마스터 테이블
CREATE TABLE SF_INCIDENT (
    INCIDENT_ID       NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TITLE             VARCHAR2(200)   NOT NULL,             -- 사건명 (예: 유성구 궁동 침수)
    DISASTER_TYPE     VARCHAR2(30)    NOT NULL,             -- 재난유형 (침수/화재/산사태 등)
    SEVERITY          VARCHAR2(10)    NOT NULL,             -- 위험도 (LOW/MEDIUM/HIGH)
    STATUS            VARCHAR2(20)    DEFAULT 'RECEIVED',   -- 발생/접수/확인중/대응중/복구중/종료
    REGION            VARCHAR2(100)   NOT NULL,             -- 지역명
    LATITUDE          NUMBER(10,6),                          -- 위도
    LONGITUDE         NUMBER(10,6),                          -- 경도
    ASSIGNED_STAFF_ID  NUMBER,                                -- 담당자 ID (미배정시 NULL)
    CLOSE_REASON      VARCHAR2(500),                         -- 종료 사유 (종료시 필수)
    CREATED_AT        TIMESTAMP       DEFAULT SYSTIMESTAMP,
    UPDATED_AT        TIMESTAMP       DEFAULT SYSTIMESTAMP
);

-- Incident 상태변경 이력 (감사로그 + 화면의 Timeline에 사용)
CREATE TABLE SF_INCIDENT_LOG (
    LOG_ID       NUMBER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    INCIDENT_ID  NUMBER      NOT NULL REFERENCES SF_INCIDENT(INCIDENT_ID),
    PREV_STATUS  VARCHAR2(20),
    NEW_STATUS   VARCHAR2(20)    NOT NULL,
    MEMO         VARCHAR2(500),                  -- 조치사항 등록 내용
    CHANGED_BY   NUMBER,                          -- 변경한 담당자 ID
    CHANGED_AT   TIMESTAMP   DEFAULT SYSTIMESTAMP
);

-- 시민 현장제보
CREATE TABLE SF_REPORT (
    REPORT_ID     NUMBER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MEMBER_ID     NUMBER      NOT NULL,               -- 제보한 시민 ID
    DISASTER_TYPE VARCHAR2(30) NOT NULL,
    CONTENT       VARCHAR2(1000),
    LATITUDE      NUMBER(10,6) NOT NULL,
    LONGITUDE     NUMBER(10,6) NOT NULL,
    PHOTO_URL     VARCHAR2(500),
    INCIDENT_ID   NUMBER      REFERENCES SF_INCIDENT(INCIDENT_ID),  -- 연결된 Incident (미연결시 NULL)
    STATUS        VARCHAR2(20) DEFAULT 'RECEIVED',    -- 접수/확인/연결됨
    CREATED_AT    TIMESTAMP   DEFAULT SYSTIMESTAMP
);

-- 인덱스: 중복탐지 시 지역/시간 조건 조회가 잦으므로
CREATE INDEX IDX_SF_INCIDENT_REGION_STATUS ON SF_INCIDENT(REGION, STATUS);
CREATE INDEX IDX_SF_REPORT_TYPE_TIME ON SF_REPORT(DISASTER_TYPE, CREATED_AT);