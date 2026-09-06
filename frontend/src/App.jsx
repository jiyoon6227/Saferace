import React, { useState, useEffect, useRef } from "react";
import {
  Home, MapPin, ShieldAlert, Camera, GraduationCap, Users,
  Search, Menu, Bell, ChevronRight, ChevronLeft, ChevronDown, CloudRain, Wind, Waves,
  Thermometer, Mountain, CloudFog, Fish, Snowflake, Flame, Droplets,
  CheckCircle2, Clock, Truck, Construction, ArrowRight, Navigation, X
} from "lucide-react";
import LoginPage from "./pages/LoginPage";
import StaffDashboard from "./pages/StaffDashboard";
import ControlBoard from "./pages/ControlBoard";
import ReportForm from "./pages/ReportForm";
import { getCurrentUser, authFetch } from "./api/client";
import { connectIncidentSocket } from "./api/socket";

// ---- 색상/토큰 -----------------------------------------------------------
// 신뢰감 있는 네이비(공공/안전) + 경보용 레드 + 대응중 앰버 + 완료 그린
// 정보 제공형 사이트가 아니라 "추적형" 서비스라는 걸 타임라인 컴포넌트로 강조

const quickMenu = [
  { icon: Home, label: "대피시설" },
  { icon: ShieldAlert, label: "위험지역" },
  { icon: Camera, label: "현장제보", highlight: true },
  { icon: GraduationCap, label: "행동요령" },
  { icon: Users, label: "가족확인" },
  { icon: Navigation, label: "우회경로" },
];

const disasterMessages = [
  { type: "호우", level: "red", region: "대전 유성구 궁동", time: "16:20", text: "호우주의보 발령. 하천 인근 주민은 안전한 곳으로 대피 바랍니다." },
  { type: "화재", level: "red", region: "대전 서구 갈마동", time: "16:13", text: "화재 발생. 인근 주민은 창문을 닫고 대피 안내에 따라주세요." },
  { type: "도로통제", level: "amber", region: "유성대로 일부구간", time: "16:09", text: "침수로 인한 도로 통제 중. 우회 바랍니다." },
];

const actionGuides = [
  { icon: Wind, label: "태풍" },
  { icon: CloudRain, label: "호우" },
  { icon: Waves, label: "홍수" },
  { icon: Thermometer, label: "폭염" },
  { icon: CloudFog, label: "가뭄" },
  { icon: Mountain, label: "산사태" },
  { icon: Snowflake, label: "한파" },
  { icon: Fish, label: "적조" },
];

// STAFF 화면(ControlBoard.jsx)과 같은 6단계 라벨/색 — 시민 화면에도 같은 기준으로 노출
const STATUS_LABEL = {
  RECEIVED: "접수",
  CONFIRMING: "확인중",
  RESPONDING: "대응중",
  RECOVERING: "복구중",
  CLOSED: "종료",
};

const STATUS_STYLE = {
  RECEIVED: "bg-slate-200 text-slate-700",
  CONFIRMING: "bg-sky-200 text-sky-800",
  RESPONDING: "bg-rose-200 text-rose-800",
  RECOVERING: "bg-yellow-200 text-yellow-800",
  CLOSED: "bg-emerald-200 text-emerald-800",
};

// 사건 카드 왼쪽 상태 색 막대 (뱃지 배경보다 진한 톤으로, 목록에서 한눈에 구분되게)
const STATUS_BAR = {
  RECEIVED: "bg-slate-200",
  CONFIRMING: "bg-sky-300",
  RESPONDING: "bg-rose-300",
  RECOVERING: "bg-yellow-300",
  CLOSED: "bg-emerald-300",
};

// 제보 등록 폼(ReportForm.jsx)의 재난유형 값과 맞춘 아이콘 매핑
const DISASTER_ICON = {
  화재: Flame,
  침수: Droplets,
  산사태: Mountain,
  강풍: Wind,
  폭염: Thermometer,
  한파: Snowflake,
};

// 모달 상세화면 상단 배너 배경 (은은한 톤)
const STATUS_BANNER = {
  RECEIVED: "bg-slate-100 border border-slate-200",
  CONFIRMING: "bg-sky-100 border border-sky-200",
  RESPONDING: "bg-rose-100 border border-rose-200",
  RECOVERING: "bg-yellow-100 border border-yellow-200",
  CLOSED: "bg-emerald-100 border border-emerald-200",
};

// 타임라인 점 색 (뱃지보다 진하게, 시각적으로 딱 떨어지게)
const STATUS_DOT = {
  RECEIVED: "bg-slate-300",
  CONFIRMING: "bg-sky-400",
  RESPONDING: "bg-rose-400",
  RECOVERING: "bg-yellow-400",
  CLOSED: "bg-emerald-400",
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

// 카드 안에 넣는 축소판 타임라인 — 모달 상세의 타임라인과 같은 구성(점+라벨+시각+메모)을 더 작게
function MiniTimeline({ logs }) {
  if (!logs) {
    return <p className="text-[10px] text-slate-400 mt-2">불러오는 중...</p>;
  }
  if (logs.length === 0) {
    return <p className="text-[10px] text-slate-400 mt-2">아직 기록이 없습니다.</p>;
  }
  return (
    <div className="mt-2.5">
      {logs.map((log, i) => (
        <React.Fragment key={log.logId}>
          <div className="flex items-start gap-1.5">
            <span
              className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[log.newStatus] || "bg-slate-400"}`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                <span className="text-xs font-semibold text-slate-700">{STATUS_LABEL[log.newStatus] || log.newStatus}</span>
                <span className="text-[10px] text-slate-400">{formatDateTime(log.changedAt)}</span>
              </div>
              {log.memo && <div className="text-[11px] text-slate-500 leading-tight">{log.memo}</div>}
            </div>
          </div>
          {i < logs.length - 1 && (
            <div className="pl-[3px] py-0.5">
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function LevelBadge({ level, children }) {
  const styles = {
    red: "bg-red-600 text-white",
    amber: "bg-amber-500 text-white",
    blue: "bg-blue-600 text-white",
  };
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded ${styles[level] || styles.blue}`}>
      {children}
    </span>
  );
}

export default function App() {
  const currentUser = getCurrentUser();
  const isStaff = currentUser?.role === "STAFF" || currentUser?.role === "ADMIN";

  const [tab, setTab] = useState("nearby");
  const [page, setPage] = useState("home"); // "home" | "login"
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [myReportsLoading, setMyReportsLoading] = useState(false);

  // 연결된 사건들의 현재 상태 (incidentId -> Incident 객체)
  const [incidentInfo, setIncidentInfo] = useState({});
  // 연결된 사건들의 처리 타임라인 (incidentId -> IncidentLog[]) - 사이드바 카드에 바로 보여주기 위함
  const [incidentTimelines, setIncidentTimelines] = useState({});

  // 대응상황 추적 모달 상태
  // trackingOpen=true & detailIncidentId=null  -> "내 연결된 사건 목록" 모드 (전체보기용)
  // trackingOpen=true & detailIncidentId=있음  -> 그 사건의 상태+타임라인 상세 모드
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [detailIncidentId, setDetailIncidentId] = useState(null);
  const detailIncidentIdRef = useRef(null); // 소켓 콜백 안에서 "지금 열려있는 모달"의 최신값을 읽기 위함
  useEffect(() => {
    detailIncidentIdRef.current = detailIncidentId;
  }, [detailIncidentId]);
  const [detailTimeline, setDetailTimeline] = useState([]);
  const [detailTimelineLoading, setDetailTimelineLoading] = useState(false);

  // 로그인된 상태면 화면 진입 시 내가 등록한 제보 목록을 실제 DB에서 가져옴
  useEffect(() => {
    if (!token) {
      setMyReports([]);
      return;
    }
    setMyReportsLoading(true);
    authFetch("/api/reports/my")
      .then(setMyReports)
      .catch(() => setMyReports([]))
      .finally(() => setMyReportsLoading(false));
  }, [token, reportSuccess]);

  // myReports가 갱신될 때마다, 연결된(고유한) Incident들의 현재 상태 + 타임라인을 같이 가져옴
  useEffect(() => {
    const uniqueIds = [...new Set(myReports.filter((r) => r.incidentId).map((r) => r.incidentId))];
    uniqueIds.forEach((id) => {
      if (!incidentInfo[id]) {
        authFetch(`/api/incidents/${id}`)
          .then((data) => setIncidentInfo((prev) => ({ ...prev, [id]: data })))
          .catch(() => {});
      }
      if (!incidentTimelines[id]) {
        authFetch(`/api/incidents/${id}/timeline`)
          .then((data) => setIncidentTimelines((prev) => ({ ...prev, [id]: data })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReports]);

  // 로그인 상태일 때 WebSocket 연결 - STAFF가 내가 추적 중인 사건 상태를 바꾸면
  // 새로고침 없이 뱃지/타임라인이 자동으로 갱신됨
  useEffect(() => {
    if (!token) return;

    const socket = connectIncidentSocket((data) => {
      const changedId = data.incident?.incidentId;
      if (!changedId) return;

      // 내가 추적 중인(=이미 incidentInfo에 있는) 사건일 때만 반응 - 남의 사건까지 다 받아서 처리할 필요 없음
      setIncidentInfo((prev) => {
        if (!prev[changedId]) return prev;
        return { ...prev, [changedId]: data.incident };
      });

      setIncidentTimelines((prev) => {
        if (!(changedId in prev)) return prev; // 추적 중인 사건이 아니면 굳이 새로 안 가져옴
        authFetch(`/api/incidents/${changedId}/timeline`)
          .then((timeline) => setIncidentTimelines((p) => ({ ...p, [changedId]: timeline })))
          .catch(() => {});
        return prev;
      });

      // 지금 이 사건의 상세 모달이 열려있으면 그 타임라인도 같이 갱신
      if (detailIncidentIdRef.current === changedId) {
        authFetch(`/api/incidents/${changedId}/timeline`)
          .then(setDetailTimeline)
          .catch(() => {});
      }
    });

    return () => socket.close();
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  // 로그인 안 한 상태에서 현장제보 누르면 로그인부터 하도록 유도
  const handleReportClick = () => {
    if (!token) {
      setPage("login");
      return;
    }
    setShowReportForm(true);
  };

  const handleReportSuccess = () => {
    setShowReportForm(false);
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 4000);
  };

  // 특정 사건의 상세(상태+타임라인)를 모달로 열기
  const openIncidentDetail = async (incidentId) => {
    setTrackingOpen(true);
    setDetailIncidentId(incidentId);
    setDetailTimelineLoading(true);
    try {
      const data = await authFetch(`/api/incidents/${incidentId}/timeline`);
      setDetailTimeline(data);
    } catch {
      setDetailTimeline([]);
    } finally {
      setDetailTimelineLoading(false);
    }
  };

  // "담당기관 대응상황 전체보기" - 연결된 사건이 하나뿐이면 바로 상세로, 여러 개면 목록으로
  const openTrackingOverview = () => {
    const uniqueIds = [...new Set(myReports.filter((r) => r.incidentId).map((r) => r.incidentId))];
    if (uniqueIds.length === 1) {
      openIncidentDetail(uniqueIds[0]);
    } else {
      setTrackingOpen(true);
      setDetailIncidentId(null);
    }
  };

  const closeTracking = () => {
    setTrackingOpen(false);
    setDetailIncidentId(null);
    setDetailTimeline([]);
  };

  const uniqueLinkedIds = [...new Set(myReports.filter((r) => r.incidentId).map((r) => r.incidentId))];
  const detailIncident = detailIncidentId ? incidentInfo[detailIncidentId] : null;
  const unlinkedReports = myReports.filter((r) => !(r.status === "LINKED" && r.incidentId));

  // "내 현장제보 추적"을 제보 단위가 아니라 "연결된 사건" 단위로 묶음 —
  // 같은 사건에 제보 여러 개가 묶여도 카드 하나로 압축되고, 최근 업데이트순으로 정렬
  const groupedIncidents = uniqueLinkedIds
    .map((id) => ({
      incidentId: id,
      incident: incidentInfo[id],
      reports: myReports.filter((r) => r.incidentId === id),
    }))
    .sort((a, b) => {
      const ta = a.incident?.updatedAt ? new Date(a.incident.updatedAt).getTime() : 0;
      const tb = b.incident?.updatedAt ? new Date(b.incident.updatedAt).getTime() : 0;
      return tb - ta;
    });

  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const visibleGroups = showAllIncidents ? groupedIncidents : groupedIncidents.slice(0, 3);
  const hiddenCount = groupedIncidents.length - visibleGroups.length;

  if (page === "login") {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onBackToHome={() => setPage("home")} />;
  }

  if (page === "staff" && isStaff) {
    return <ControlBoard onBackToHome={() => setPage("home")} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 상단 유틸바 */}
      <div className="bg-[#0F2540] text-slate-300 text-xs">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <span>대전 · 세종 · 충청권 재난 상황추적 서비스</span>
          <div className="flex gap-4">
          {token ? (
              <>
                {isStaff && (
                  <button className="hover:text-white" onClick={() => setPage("staff")}>STAFF 대시보드</button>
                )}
                <button className="hover:text-white" onClick={handleLogout}>로그아웃</button>
              </>
            ) : (
              <button className="hover:text-white" onClick={() => setPage("login")}>로그인</button>
            )}
            <button className="hover:text-white" onClick={() => setPage("login")}>회원가입</button>
          </div>
        </div>
      </div>

      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#0F2540] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-lg text-[#0F2540] tracking-tight">세이프트레이스</div>
              <div className="text-[10px] text-slate-400 tracking-wide">SAFETRACE · 재난 상황추적</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button className="text-[#0F2540] font-bold border-b-2 border-amber-500 pb-4 -mb-4">내 주변 재난</button>
            <button className="hover:text-[#0F2540]">현장제보</button>
            <button className="hover:text-[#0F2540]">내 제보 추적</button>
            <button className="hover:text-[#0F2540]">행동요령</button>
            <button className="hover:text-[#0F2540]">안전지도</button>
          </nav>

          <div className="flex items-center gap-3 text-slate-500">
            <Search className="w-5 h-5 cursor-pointer hover:text-[#0F2540]" />
            <div className="relative">
              <Bell className="w-5 h-5 cursor-pointer hover:text-[#0F2540]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <Menu className="w-5 h-5 md:hidden cursor-pointer" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 시그니처 히어로 : 내 주변 재난 영향도 + 지금 해야 할 일 */}
        <section className="bg-gradient-to-br from-[#0F2540] to-[#1B3A5C] rounded-2xl p-6 md:p-8 text-white mb-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-red-500/10" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LevelBadge level="red">대응중</LevelBadge>
                <span className="text-slate-300 text-sm">유성구 궁동 침수 · Incident #127</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-1">
                내 위치에서 <span className="text-amber-400">약 1.3km</span> 떨어진 곳에 재난이 발생했습니다
              </h1>
              <p className="text-slate-300 text-sm">현재 담당기관이 대응 중이며, 상황은 실시간으로 갱신됩니다.</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {["지하차도 진입 자제", "하천 주변 접근 금지", "우회로 이용 권장"].map((t) => (
                  <span key={t} className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            <button className="shrink-0 bg-amber-500 hover:bg-amber-400 text-[#0F2540] font-bold rounded-xl px-5 py-3 flex items-center gap-2 self-start md:self-center">
              내 주변 재난지도 보기 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 빠른메뉴 */}
        <section className="mb-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickMenu.map(({ icon: Icon, label, highlight }) => (
              <button
                key={label}
                onClick={label === "현장제보" ? handleReportClick : undefined}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition
                  ${highlight
                    ? "bg-red-50 border-red-200 hover:border-red-400"
                    : "bg-white border-slate-200 hover:border-[#0F2540]"}`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center
                  ${highlight ? "bg-red-100 text-red-600" : "bg-slate-100 text-[#0F2540]"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{label}</span>
              </button>
            ))}
          </div>
        </section>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 왼쪽: 재난속보 + 내 제보 추적 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 재난속보 */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setTab("nearby")}
                  className={`flex-1 py-3 text-sm font-bold ${tab === "nearby" ? "text-[#0F2540] border-b-2 border-[#0F2540]" : "text-slate-400"}`}
                >
                  재난속보 · 문자
                </button>
                <button
                  onClick={() => setTab("news")}
                  className={`flex-1 py-3 text-sm font-bold ${tab === "news" ? "text-[#0F2540] border-b-2 border-[#0F2540]" : "text-slate-400"}`}
                >
                  재난 뉴스
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {disasterMessages.map((m, i) => (
                  <li key={i} className="p-4 flex gap-3 hover:bg-slate-50 cursor-pointer">
                    <LevelBadge level={m.level}>{m.type}</LevelBadge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-600">{m.region}</span>
                        <span>·</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="text-sm text-slate-700 truncate">{m.text}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 self-center" />
                  </li>
                ))}
              </ul>
            </section>

            {/* 재난유형별 행동요령 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#0F2540]">국민행동요령</h2>
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">여름철 주요재난</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {actionGuides.map(({ icon: Icon, label }) => (
                  <button key={label} className="flex flex-col items-center gap-2 py-4 rounded-xl border border-slate-200 hover:border-[#0F2540] hover:bg-slate-50">
                    <Icon className="w-6 h-6 text-[#0F2540]" />
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽: 날씨 + 내 제보 추적 (시그니처) */}
          <div className="space-y-6">
            {/* 날씨 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-1 text-sm font-bold text-[#0F2540] mb-3">
                <MapPin className="w-4 h-4" /> 대전광역시 유성구
              </div>
              <div className="text-4xl font-extrabold text-[#0F2540]">29°C</div>
              <div className="text-sm text-slate-500 mt-1">습도 70% · 강수확률 60%</div>
              <div className="text-sm text-slate-500">풍속 0.4m/s</div>
            </section>

            {/* 내 제보 추적 — 프로젝트 시그니처 컴포넌트 */}
            <section className="bg-white rounded-2xl border-2 border-[#0F2540] p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-[#0F2540]">내 현장제보 추적</h2>
                <Camera className="w-4 h-4 text-slate-400" />
              </div>

              {!token && (
                <p className="text-xs text-slate-500 py-4">로그인하면 내가 등록한 제보를 확인할 수 있습니다.</p>
              )}

              {token && myReportsLoading && (
                <p className="text-xs text-slate-400 py-4">불러오는 중...</p>
              )}

              {token && !myReportsLoading && myReports.length === 0 && (
                <p className="text-xs text-slate-500 py-4">아직 등록한 제보가 없습니다.</p>
              )}

              {/* 사건에 연결된 제보 — 사건 단위로 묶어서 카드 하나로 표시 */}
              {token && !myReportsLoading && groupedIncidents.length > 0 && (
                <>
                  <ul className="space-y-2 mb-1">
                    {visibleGroups.map(({ incidentId, incident, reports }) => {
                      const Icon = DISASTER_ICON[reports[0]?.disasterType] || ShieldAlert;
                      const barColor = STATUS_BAR[incident?.status] || "bg-slate-300";
                      return (
                        <li
                          key={incidentId}
                          onClick={() => openIncidentDetail(incidentId)}
                          className="relative rounded-xl border border-slate-100 hover:border-[#0F2540] hover:shadow-sm cursor-pointer transition overflow-hidden"
                        >
                          <span className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                          <div className="p-3 pl-4">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-sm font-semibold text-slate-800 truncate">
                                  {incident?.title || `${reports[0]?.disasterType} 관련 사건`}
                                </span>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${STATUS_STYLE[incident?.status] || "bg-slate-100 text-slate-500"}`}>
                                {incident ? STATUS_LABEL[incident.status] || incident.status : "확인 중..."}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              내 제보 {reports.length}건 포함 (#{reports.map((r) => r.reportId).join(", #")})
                            </p>
                            {incident && <MiniTimeline logs={incidentTimelines[incidentId]} />}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllIncidents(true)}
                      className="w-full text-xs font-semibold text-slate-500 hover:text-[#0F2540] py-2 flex items-center justify-center gap-1"
                    >
                      더보기 ({hiddenCount}건 더) <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {showAllIncidents && groupedIncidents.length > 3 && (
                    <button
                      onClick={() => setShowAllIncidents(false)}
                      className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
                    >
                      접기
                    </button>
                  )}
                </>
              )}

              {/* 아직 사건에 연결 안 된 제보 — 접수 대기 상태만 짧게 안내 */}
              {token && !myReportsLoading && unlinkedReports.length > 0 && (
                <div className={groupedIncidents.length > 0 ? "mt-3 pt-3 border-t border-slate-100" : ""}>
                  <p className="text-xs text-slate-400">
                    접수 대기 중인 제보 {unlinkedReports.length}건 (#{unlinkedReports.map((r) => r.reportId).join(", #")}) · 확인중
                  </p>
                </div>
              )}

              <button
                onClick={openTrackingOverview}
                disabled={uniqueLinkedIds.length === 0}
                className="mt-4 w-full text-sm font-bold text-[#0F2540] border border-slate-200 rounded-lg py-2.5 flex items-center justify-center gap-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                담당기관 대응상황 전체보기 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </section>

            {/* 가족 안전확인 미니 카드 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-[#0F2540] mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 가족 안전확인
              </h2>
              <div className="space-y-2">
                {[
                  { name: "아빠 · 유성구", status: "확인 필요", ok: false },
                  { name: "엄마 · 서구", status: "안전확인 15:31", ok: true },
                ].map((f) => (
                  <div key={f.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{f.name}</span>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${f.ok ? "text-emerald-600" : "text-red-500"}`}>
                      {f.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        세이프트레이스 · 대전·세종·충청권 재난 상황관리·대응 플랫폼 (개인 프로젝트 데모)
      </footer>

      {showReportForm && (
        <ReportForm onClose={() => setShowReportForm(false)} onSuccess={handleReportSuccess} />
      )}

      {reportSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F2540] text-white text-sm font-semibold rounded-lg px-4 py-3 shadow-lg z-50">
          제보가 접수되었습니다. 담당자가 확인 후 처리할 예정입니다.
        </div>
      )}

      {/* 대응상황 추적 모달 - 목록 모드 / 상세(타임라인) 모드 겸용 */}
      {trackingOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                {detailIncidentId && (
                  <button
                    onClick={() => setDetailIncidentId(null)}
                    className="text-slate-400 hover:text-[#0F2540] -ml-1 p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="font-bold text-[#0F2540]">
                  {detailIncidentId ? "대응상황 상세" : "담당기관 대응상황"}
                </h2>
              </div>
              <button onClick={closeTracking} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {/* 목록 모드: 연결된 사건이 여러 개일 때 */}
              {!detailIncidentId && (
                <ul className="space-y-2">
                  {groupedIncidents.map(({ incidentId, incident, reports }) => {
                    const Icon = DISASTER_ICON[reports[0]?.disasterType] || ShieldAlert;
                    return (
                      <li
                        key={incidentId}
                        onClick={() => openIncidentDetail(incidentId)}
                        className="relative rounded-xl border border-slate-100 hover:border-[#0F2540] hover:shadow-sm cursor-pointer transition overflow-hidden"
                      >
                        <span className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_BAR[incident?.status] || "bg-slate-300"}`} />
                        <div className="p-3 pl-4">
                          <div className="flex items-center justify-between mb-0.5 gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-sm font-semibold text-slate-700 truncate">
                                {incident?.title || `사건 #${incidentId}`}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${STATUS_STYLE[incident?.status] || ""}`}>
                              {incident ? STATUS_LABEL[incident.status] || incident.status : "확인 중..."}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {incident?.region} · 내 제보 {reports.length}건
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* 상세 모드: 특정 사건의 상태 배너 + 타임라인 */}
              {detailIncidentId && (
                <div>
                  {detailIncident && (
                    <div className={`rounded-xl p-4 mb-5 ${STATUS_BANNER[detailIncident.status] || "bg-slate-50 border border-slate-200"}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[detailIncident.status] || ""}`}>
                          {STATUS_LABEL[detailIncident.status] || detailIncident.status}
                        </span>
                        <span className="text-[10px] text-slate-500">#{detailIncident.incidentId}</span>
                      </div>
                      <h3 className="font-bold text-[#0F2540] mb-0.5">{detailIncident.title}</h3>
                      <p className="text-xs text-slate-500">
                        {detailIncident.region} · {detailIncident.disasterType}
                      </p>
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-slate-500 mb-3">처리 타임라인</h4>
                  {detailTimelineLoading ? (
                    <p className="text-xs text-slate-400">불러오는 중...</p>
                  ) : detailTimeline.length === 0 ? (
                    <p className="text-xs text-slate-400">아직 기록이 없습니다.</p>
                  ) : (
                    <div>
                      {detailTimeline.map((log, i) => (
                        <React.Fragment key={log.logId}>
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-1 w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-sm ${
                                STATUS_DOT[log.newStatus] || "bg-slate-400"
                              } ${i === detailTimeline.length - 1 ? "ring-2 ring-offset-1 ring-slate-200" : ""}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-700">
                                  {STATUS_LABEL[log.newStatus] || log.newStatus}
                                </span>
                                <span className="text-[10px] text-slate-400">{formatDateTime(log.changedAt)}</span>
                              </div>
                              {log.memo && <div className="text-xs text-slate-500 mt-0.5">{log.memo}</div>}
                            </div>
                          </div>
                          {i < detailTimeline.length - 1 && (
                            <div className="pl-[5px] py-1">
                              <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
