# 세이프트레이스 (SafeTrace)

대전·세종·충청권 재난 상황관리·대응 플랫폼 개인 프로젝트

## 폴더 구조

```
safetrace/
├── frontend/          ← React 화면 (JavaScript)
│   ├── src/
│   │   ├── App.jsx    ← 시민 홈 화면
│   │   └── index.css
│   └── vite.config.js
│
└── backend/           ← Spring Boot 서버 (Java)
    ├── pom.xml
    ├── application.yml
    ├── schema.sql
    ├── 백엔드_실행가이드.md   ← 여기부터 읽으세요
    └── src/main/java/com/safetrace/
        ├── domain/         (Incident, Report 등)
        ├── mapper/         (MyBatis)
        ├── service/        (핵심 로직: Workflow, 중복탐지)
        ├── controller/     (REST API)
        ├── websocket/      (실시간 알림)
        └── config/
```

## 시작하는 순서

1. `backend/백엔드_실행가이드.md` 읽고 Spring Boot 서버 먼저 띄우기 (IntelliJ 추천)
2. `frontend` 폴더에서 아래 명령어로 화면 실행:
   ```
   npm create vite@latest . -- --template react
   ```
   (이미 있는 src/App.jsx, vite.config.js는 유지하고 나머지 필요한 설정파일만 생성됨)
   또는 기존에 만들어둔 safetrace 프론트 프로젝트가 있다면 그 폴더의 src/App.jsx, vite.config.js, src/index.css를 여기 파일로 교체
3. `npm install` → `npm install lucide-react` → `npm install tailwindcss @tailwindcss/vite`
4. `npm run dev` 로 화면 실행 (백엔드는 8080, 프론트는 5173에서 각각 따로 켜져 있어야 함)

## 지금까지 완성된 것 / 안 된 것

✅ Incident 생성·조회·상태전이(6단계 Workflow)·타임라인
✅ 시민제보 중복탐지 로직 (위경도 거리계산)
✅ WebSocket 실시간 브로드캐스트
✅ 시민 홈 화면 UI (React)

⬜ 로그인/JWT (SecurityConfig 골격만 있음)
⬜ 시민 제보 등록 API
⬜ 공공데이터 API 연동 (재난문자/기상)
⬜ Redis 캐싱
⬜ Resilience4j 장애대응
⬜ STAFF 관제 화면
