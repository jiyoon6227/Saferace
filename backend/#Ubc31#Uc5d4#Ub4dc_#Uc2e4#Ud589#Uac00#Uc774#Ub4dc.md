# 세이프트레이스 백엔드 (Spring Boot)

## 지금까지 만든 것

Incident(재난 사건) 하나를 중심으로 한 핵심 뼈대입니다.

```
com.safetrace
├── SafetraceApplication.java   ← 실행 시작점
├── domain/                     ← DB 테이블과 매핑되는 자바 클래스
│   ├── Incident.java
│   ├── IncidentLog.java        (상태변경 이력 = 타임라인)
│   ├── IncidentStatus.java     (6단계 워크플로우 규칙)
│   └── Report.java             (시민 제보)
├── mapper/
│   └── IncidentMapper.java     ← DB 접근 인터페이스 (MyBatis)
├── service/
│   └── IncidentService.java    ← 핵심 로직: 상태전이 규칙, 중복탐지
├── controller/
│   └── IncidentController.java ← React가 호출하는 API 주소들
├── websocket/
│   └── IncidentWebSocketHandler.java  ← 실시간 알림
└── config/
    ├── WebSocketConfig.java
    └── SecurityConfig.java     (지금은 골격만, 로그인은 다음 단계)

resources/
├── application.yml    ← DB 접속정보
└── mappers/
    └── IncidentMapper.xml  ← 실제 SQL문
```

## 실행 전 준비물

1. **자바 21 설치 확인**
   - 터미널에 `java -version` 입력, 21 이상 나오면 OK
   - 안 되어 있으면 https://adoptium.net 에서 21 버전 설치

2. **개발 도구**
   - 프론트는 VS Code로 했지만, 자바/스프링은 **IntelliJ IDEA (Community 버전, 무료)** 를 추천합니다.
   - VS Code로도 가능하지만 IntelliJ가 자바 프로젝트 자동 설정을 훨씬 편하게 해줍니다.
   - https://www.jetbrains.com/idea/download 에서 Community 버전 설치

3. **Oracle DB**
   - 이미 학원에서 쓰던 Oracle이 있다면 그대로 사용
   - `application.yml`의 url/username/password를 본인 DB 정보로 수정

## 실행 순서

1. IntelliJ에서 `backend` 폴더 통째로 열기 (Open 클릭)
2. `pom.xml`이 인식되면 자동으로 필요한 라이브러리를 다운로드합니다 (인터넷 필요, 처음엔 좀 걸림)
3. Oracle DB에 접속해서 `schema.sql` 파일 내용을 실행 → TB_INCIDENT 등 테이블 생성
4. `application.yml`에서 DB 접속정보를 본인 것으로 수정
5. `SafetraceApplication.java` 파일 열고, 코드 왼쪽의 초록색 실행버튼(▶) 클릭
6. 콘솔에 "Tomcat started on port 8080" 같은 메시지가 뜨면 성공

## 잘 작동하는지 확인하는 방법

브라우저나 Postman으로:
```
GET http://localhost:8080/api/incidents/region/유성구
```
빈 배열 `[]`이 나오면 서버는 정상 작동 중입니다 (아직 데이터가 없어서 빈 값).

## React와 연결하려면

`SafeTraceHome.jsx`에 있는 mock 데이터(`disasterMessages`, `myReportSteps` 등)를
아래처럼 실제 API 호출로 바꾸면 됩니다:

```jsx
import { useEffect, useState } from "react";

const [incidents, setIncidents] = useState([]);

useEffect(() => {
  fetch("http://localhost:8080/api/incidents/region/유성구")
    .then(res => res.json())
    .then(data => setIncidents(data));
}, []);
```

WebSocket 실시간 연결:
```jsx
useEffect(() => {
  const ws = new WebSocket("ws://localhost:8080/ws/incidents");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("실시간 이벤트 수신:", data);
    // data.eventType 이 "STATUS_CHANGED" 등으로 옴
  };
  return () => ws.close();
}, []);
```

## 다음 단계 (우선순위 순서)

1. ✅ Incident 생성 + 조회 + 상태전이 + 타임라인 (지금까지 만든 것)
2. 시민 제보(Report) API 완성 — 제보 등록 + 중복탐지 결과 반환
3. 로그인/회원가입 (Spring Security + JWT)
4. STAFF 상황판 화면과 실제 연동
5. 공공 API(재난문자, 기상) 연동 + 스케줄러로 자동 수집
6. Redis 캐싱
7. Resilience4j 장애대응
8. (여유되면) LLM 상황요약
