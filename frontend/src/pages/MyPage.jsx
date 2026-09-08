import React, { useEffect, useState } from "react";
import {
  ShieldAlert, ArrowLeft, User, Users, Bell, MapPin, Camera,
  CheckCircle2, AlertTriangle, Trash2, UserPlus, Lock, X, ClipboardList, Sun, ChevronRight, Home, TreePine, Heart
} from "lucide-react";
import { authFetch, authUpload } from "../api/client";

const TABS = [
  { key: "info", label: "내 정보", icon: User },
  { key: "family", label: "가족 관리", icon: Users },
  { key: "safety", label: "안전확인 이력", icon: ShieldAlert },
  { key: "reports", label: "내 제보 내역", icon: Camera },
  { key: "regions", label: "관심 지역", icon: MapPin },
  { key: "notify", label: "알림 설정", icon: Bell },
];

const RELATION_TYPES = ["배우자", "자녀", "부모님", "형제자매", "가족"];

// 숫자만 입력해도 010-1234-5678 형태로 자동 변환. 02(서울 지역번호)는 2자리로 처리
const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

const ROLE_LABEL = { USER: "시민 사용자", STAFF: "담당 직원", ADMIN: "관리자" };

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const SAFETY_STATUS_LABEL = { PENDING: "응답 대기", SAFE: "안전해요", HELP: "도움 필요" };
const SAFETY_STATUS_STYLE = {
  PENDING: "bg-slate-100 text-slate-500",
  SAFE: "bg-emerald-100 text-emerald-700",
  HELP: "bg-red-100 text-red-700",
};

// 사건(Incident) 상태 한글 라벨 - 홈화면/관제탭과 동일한 기준
const STATUS_LABEL_KO = {
  RECEIVED: "접수",
  CONFIRMING: "확인중",
  RESPONDING: "대응중",
  RECOVERING: "복구중",
  CLOSED: "종료",
};

// Daum(다음) 우편번호 서비스 - 무료 공개 위젯, API 키 불필요
function loadDaumPostcodeScript() {
  if (window.daum && window.daum.Postcode) return;
  if (document.getElementById("daum-postcode-script")) return;
  const script = document.createElement("script");
  script.id = "daum-postcode-script";
  script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  script.async = true;
  document.body.appendChild(script);
}

export default function MyPage({ onBackToHome, onLogout }) {
  const [activeTab, setActiveTab] = useState("info");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [member, setMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState("");

  const [families, setFamilies] = useState([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);

  const [sentChecks, setSentChecks] = useState([]);
  const [receivedChecks, setReceivedChecks] = useState([]);

  const [regions, setRegions] = useState([]);

  const [myReports, setMyReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const loadMember = () => {
    setMemberLoading(true);
    setMemberError("");
    authFetch("/api/mypage")
      .then(setMember)
      .catch((err) => setMemberError(err.message))
      .finally(() => setMemberLoading(false));
  };

  const loadFamilies = () => {
    setFamiliesLoading(true);
    authFetch("/api/family")
      .then(setFamilies)
      .catch(() => {})
      .finally(() => setFamiliesLoading(false));
  };

  const loadSafetyChecks = () => {
    authFetch("/api/safety-checks/sent").then(setSentChecks).catch(() => {});
    authFetch("/api/safety-checks/received").then(setReceivedChecks).catch(() => {});
  };

  const loadRegions = () => {
    authFetch("/api/mypage/regions").then(setRegions).catch(() => {});
  };

  const loadReports = () => {
    setReportsLoading(true);
    authFetch("/api/reports/my")
      .then(setMyReports)
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  };

  useEffect(() => {
    loadMember();
    loadFamilies();
    loadSafetyChecks();
    loadRegions();
    loadReports();
    loadDaumPostcodeScript();
  }, []);

  // 가족 한 명에 대해 내가 마지막으로 보낸 안전확인 요청의 상태 (없으면 null)
  const latestStatusFor = (familyMemberId) => {
    const relevant = sentChecks
      .filter((c) => c.targetMemberId === familyMemberId)
      .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    return relevant[0]?.status || null;
  };

  const safetyCheckTotal = sentChecks.length + receivedChecks.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBackToHome} className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-[#0F2540] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="leading-tight text-left">
              <div className="font-extrabold text-[#0F2540] text-sm">SafeTrace</div>
              <div className="text-[10px] text-slate-400">함께 만드는 더 안전한 일상</div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 font-bold text-[#0F2540]">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> 마이페이지
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onBackToHome} className="text-xs text-slate-400 hover:text-slate-600">홈으로</button>
            <Bell className="w-4 h-4 text-slate-300" />
            <button onClick={onLogout} className="text-xs text-slate-400 hover:text-slate-600">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 요약 배너 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0F2540] to-[#1B3A5C] rounded-2xl p-5 flex flex-wrap items-center gap-6 shadow-sm relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-amber-500/10" />
            <div className="flex items-center gap-3 relative">
              <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {member?.profileImageUrl ? (
                  <img src={`http://localhost:8080${member.profileImageUrl}`} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                {memberLoading ? (
                  <p className="text-sm text-slate-300">불러오는 중...</p>
                ) : memberError ? (
                  <p className="text-sm text-red-300">{memberError}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{member?.name}</span>
                      <span className="text-[10px] font-bold text-[#0F2540] bg-amber-400 px-1.5 py-0.5 rounded">
                        {ROLE_LABEL[member?.role] || member?.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{member?.email || "이메일 미등록"}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto relative">
              {[
                { icon: Users, label: "가족", value: `${families.length}명`, onClick: () => setActiveTab("family") },
                { icon: ShieldAlert, label: "안전확인", value: `${safetyCheckTotal}건`, onClick: () => setActiveTab("safety") },
                { icon: ClipboardList, label: "내 제보", value: `${myReports.length}건`, onClick: () => setActiveTab("reports") },
              ].map(({ icon: Icon, label, value, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  disabled={!onClick}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 hover:bg-white/20 transition disabled:cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#0F2540] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-sm font-bold text-white">{value}</div>
                    <div className="text-[10px] text-slate-300">{label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 flex items-center gap-3 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute right-8 top-2 w-10 h-10 rounded-full bg-white/10" />
            <Sun className="w-8 h-8 text-white shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#0F2540]">오늘도, 더 안전한 내일을 위해</p>
              <p className="text-xs text-[#0F2540]/70 mt-0.5">SafeTrace가 함께합니다</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
          {/* 왼쪽 사이드바 메뉴 */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
              <h2 className="font-bold text-[#0F2540] px-2 py-1.5 mb-1">마이페이지</h2>
              <nav className="space-y-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                      activeTab === key
                        ? "bg-sky-100 text-sky-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        activeTab === key ? "bg-sky-500 text-white" : "text-slate-400"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {label}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${activeTab === key ? "text-sky-500" : "text-slate-400"}`} />
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-gradient-to-br from-[#0F2540] to-[#1B3A5C] rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <Heart className="w-28 h-28 text-white/10 fill-white/10 absolute -right-6 -bottom-6 rotate-[-12deg]" />
              <p className="text-sm font-bold text-white leading-snug relative mb-4">
                소중한 사람들의<br />안전을<br />함께 지켜요
              </p>
              <button
                onClick={() => setActiveTab("family")}
                className="relative w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-[#0F2540] shadow-md hover:bg-amber-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </aside>

          {/* 오른쪽 컨텐츠 */}
          <div className="min-w-0">
        {activeTab === "info" && (
          <InfoTab
            member={member}
            memberLoading={memberLoading}
            memberError={memberError}
            onSaved={loadMember}
            families={families}
            familiesLoading={familiesLoading}
            latestStatusFor={latestStatusFor}
            regions={regions}
            onGoToFamily={() => setActiveTab("family")}
            onGoToRegions={() => setActiveTab("regions")}
            onGoToNotify={() => setActiveTab("notify")}
          />
        )}
        {activeTab === "family" && (
          <FamilyTab families={families} familiesLoading={familiesLoading} onChanged={loadFamilies} latestStatusFor={latestStatusFor} />
        )}
        {activeTab === "safety" && <SafetyTab sentChecks={sentChecks} receivedChecks={receivedChecks} onChanged={loadSafetyChecks} />}
        {activeTab === "reports" && <ReportsTab reports={myReports} loading={reportsLoading} onChanged={loadReports} />}
        {activeTab === "regions" && <RegionsTab regions={regions} onChanged={loadRegions} />}
        {activeTab === "notify" && <NotifyTab member={member} memberLoading={memberLoading} memberError={memberError} onSaved={loadMember} />}
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 mt-6">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-extrabold text-[#0F2540]">SafeTrace</span>
            <span className="text-slate-400">재난으로부터 안전한 사회, 지금 함께 만들어요.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button className="hover:text-slate-600">이용약관</button>
            <button className="hover:text-slate-600">개인정보처리방침</button>
            <button className="hover:text-slate-600">고객센터</button>
            <button onClick={() => setShowWithdrawModal(true)} className="hover:text-red-500">회원탈퇴</button>
          </div>
        </div>
      </footer>

      {showWithdrawModal && <WithdrawModal onClose={() => setShowWithdrawModal(false)} />}
    </div>
  );
}

function WithdrawModal({ onClose }) {
  const [error, setError] = useState("");

  const handleWithdraw = async () => {
    try {
      await authFetch("/api/mypage", { method: "DELETE" });
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-red-600">회원탈퇴</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-slate-600 bg-red-50 rounded-lg p-3 mb-4">
          탈퇴하면 다시 로그인할 수 없습니다. 작성한 제보/사건 이력은 삭제되지 않고 그대로 보존됩니다. 정말 탈퇴하시겠습니까?
        </p>
        {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleWithdraw} className="flex-1 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg py-2.5">
            탈퇴 확정
          </button>
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 내 정보 --------------------------------------------------------------

function InfoTab({
  member: initialMember, memberLoading, memberError, onSaved,
  families, familiesLoading, latestStatusFor, regions,
  onGoToFamily, onGoToRegions, onGoToNotify,
}) {
  const [draft, setDraft] = useState(initialMember);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (initialMember) setDraft(initialMember);
  }, [initialMember]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await authFetch("/api/mypage", {
        method: "PUT",
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          address: draft.address,
          addressDetail: draft.addressDetail,
          profileImageUrl: draft.profileImageUrl,
        }),
      });
      setSuccess("저장되었습니다.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(initialMember);
    setError("");
    setSuccess("");
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await authUpload("/api/uploads", formData);
      setDraft((prev) => ({ ...prev, profileImageUrl: url }));
      // 프로필 사진은 바로 저장 - 폼 전체 저장 누르기 전까지 기다릴 필요 없게
      await authFetch("/api/mypage", {
        method: "PUT",
        body: JSON.stringify({ ...draft, profileImageUrl: url }),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  const openAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert("주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setDraft((prev) => ({ ...prev, address: data.roadAddress || data.address }));
      },
    }).open();
  };

  if (memberLoading) return <p className="text-sm text-slate-400">불러오는 중...</p>;
  if (!draft) return <p className="text-sm text-red-500">{memberError || "정보를 불러오지 못했습니다."}</p>;

  const previewFamilies = families.slice(0, 3);
  const previewRegions = regions.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 왼쪽: 프로필 정보 요약 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0F2540] mb-1 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><User className="w-4 h-4" /></span>
            프로필 정보
          </h3>
          <p className="text-xs text-slate-400 mb-5 ml-9">내 프로필 정보를 관리할 수 있습니다.</p>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 overflow-hidden flex items-center justify-center shrink-0">
              {draft.profileImageUrl ? (
                <img src={`http://localhost:8080${draft.profileImageUrl}`} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-sky-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#0F2540]">{draft.name}</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                  {ROLE_LABEL[draft.role] || draft.role}
                </span>
              </div>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-slate-600 mb-5">
            <li className="flex items-center gap-2"><span className="text-slate-400 w-16 shrink-0">이메일</span>{draft.email || "-"}</li>
            <li className="flex items-center gap-2"><span className="text-slate-400 w-16 shrink-0">전화번호</span>{draft.phone || "-"}</li>
            <li className="flex items-center gap-2"><span className="text-slate-400 w-16 shrink-0">거주 지역</span>{draft.address || "-"}</li>
          </ul>

          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0F2540] border border-slate-200 rounded-lg py-2.5 cursor-pointer hover:bg-sky-50 hover:border-sky-200">
              <Camera className="w-3.5 h-3.5" /> 프로필 이미지 변경
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
            </label>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0F2540] border border-slate-200 rounded-lg py-2.5 hover:bg-sky-50 hover:border-sky-200"
            >
              <Lock className="w-3.5 h-3.5" /> 비밀번호 변경
            </button>
          </div>
        </div>

        {/* 오른쪽: 기본 정보 수정 폼 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0F2540] mb-1 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Lock className="w-4 h-4" /></span>
            기본 정보
          </h3>
          <p className="text-xs text-slate-400 mb-5 ml-9">정확한 정보는 재난 상황 시 신속한 도움을 받을 수 있도록 도와줍니다.</p>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">이름</label>
                <input
                  type="text"
                  value={draft.name || ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">이메일</label>
                <input
                  type="email"
                  value={draft.email || ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">전화번호</label>
              <input
                type="text"
                value={draft.phone || ""}
                onChange={(e) => setDraft({ ...draft, phone: formatPhoneNumber(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">주소</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={draft.address || ""}
                  onClick={openAddressSearch}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer bg-white"
                  placeholder="클릭해서 주소 검색"
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="text-xs font-semibold text-[#0F2540] border border-slate-200 rounded-lg px-3 hover:bg-slate-50 shrink-0"
                >
                  주소 검색
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">상세주소</label>
              <input
                type="text"
                value={draft.addressDetail || ""}
                onChange={(e) => setDraft({ ...draft, addressDetail: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
              />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#0F2540] hover:bg-[#1B3A5C] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 미리보기 3분할 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[#0F2540] flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></span>
              가족 관리 미리보기
            </h3>
            <button onClick={onGoToFamily} className="text-xs text-sky-600 font-semibold hover:underline">전체보기 →</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">등록된 가족 {families.length}명의 안전을 지켜주세요.</p>
          {familiesLoading ? (
            <p className="text-xs text-slate-400">불러오는 중...</p>
          ) : previewFamilies.length === 0 ? (
            <p className="text-xs text-slate-400">등록된 가족이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {previewFamilies.map((f, i) => {
                const status = latestStatusFor(f.familyMemberId);
                const avatarColors = ["from-sky-100 to-blue-100 text-sky-500", "from-rose-100 to-pink-100 text-rose-500", "from-amber-100 to-orange-100 text-amber-500"];
                return (
                  <li key={f.relationId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-slate-700 truncate">{f.familyMemberName} <span className="text-slate-400 font-normal">({f.familyMemberLoginId})</span></span>
                          <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1 py-0.5 rounded">{f.relationType}</span>
                        </div>
                        {f.familyMemberPhone && <p className="text-[10px] text-slate-400">{f.familyMemberPhone}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${status ? SAFETY_STATUS_STYLE[status] : "bg-slate-100 text-slate-400"}`}>
                      {status ? SAFETY_STATUS_LABEL[status] : "기록 없음"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[#0F2540] flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center"><MapPin className="w-3.5 h-3.5" /></span>
              관심 지역
            </h3>
            <button onClick={onGoToRegions} className="text-xs text-sky-600 font-semibold hover:underline">전체보기 →</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">재난 정보를 받고 싶은 지역을 설정하세요.</p>
          <div className="flex flex-wrap gap-1.5">
            {previewRegions.length === 0 ? (
              <p className="text-xs text-slate-400">등록된 관심지역이 없습니다.</p>
            ) : (
              previewRegions.map((r) => (
                <span key={r.memberRegionId} className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5">
                  {r.regionName}
                </span>
              ))
            )}
          </div>
          <button onClick={onGoToRegions} className="mt-3 text-xs font-semibold text-[#0F2540] hover:underline">
            + 관심지역 추가
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[#0F2540] flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center"><Bell className="w-3.5 h-3.5" /></span>
              알림 설정
            </h3>
            <button onClick={onGoToNotify} className="text-xs text-sky-600 font-semibold hover:underline">전체보기 →</button>
          </div>
          <p className="text-xs text-slate-400 mb-3">중요한 재난 정보와 가족의 안전 알림을 받아보세요.</p>
          <ul className="space-y-2.5 text-xs">
            {[
              ["가족 안전확인 이메일", draft.emailNotifyEnabled],
              ["재난 알림", draft.disasterNotifyEnabled],
              ["내 제보 상태변경", draft.reportNotifyEnabled],
            ].map(([label, val]) => (
              <li key={label} className="flex items-center justify-between">
                <span className="text-slate-600">{label}</span>
                <span className={`inline-block w-8 h-[18px] rounded-full relative ${val === "Y" ? "bg-[#0F2540]" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition ${val === "Y" ? "right-0.5" : "left-0.5"}`} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

function PasswordChangeModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== newPasswordConfirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    try {
      await authFetch("/api/mypage/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      alert("비밀번호가 변경되었습니다.");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0F2540]">비밀번호 변경</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
              required
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#0F2540] hover:bg-[#1B3A5C] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? "변경 중..." : "변경하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---- 가족 관리 --------------------------------------------------------------

function FamilyTab({ families, familiesLoading, onChanged, latestStatusFor }) {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relationType, setRelationType] = useState("가족");
  const [requestingSafetyId, setRequestingSafetyId] = useState(null);

  const loadRequests = () => {
    setLoading(true);
    setError("");
    Promise.all([authFetch("/api/family/sent"), authFetch("/api/family/received")])
      .then(([s, r]) => {
        setSent(s);
        setReceived(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadRequests, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await authFetch(`/api/family/search?loginId=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (targetLoginId) => {
    setError("");
    try {
      await authFetch("/api/family/request", {
        method: "POST",
        body: JSON.stringify({ targetLoginId, relationType }),
      });
      setSearchResults([]);
      setSearchQuery("");
      loadRequests();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const accept = async (relationId) => {
    try {
      await authFetch(`/api/family/${relationId}/accept`, { method: "PATCH" });
      loadRequests();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (relationId) => {
    try {
      await authFetch(`/api/family/${relationId}`, { method: "DELETE" });
      loadRequests();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  // 이 사람 한 명한테만 바로 안전확인 요청 (일반 요청, 특정 사건과 무관)
  const requestSafetyCheck = async (targetMemberId) => {
    setRequestingSafetyId(targetMemberId);
    try {
      await authFetch("/api/safety-checks", {
        method: "POST",
        body: JSON.stringify({ targetMemberIds: [targetMemberId], incidentId: null }),
      });
      alert("안전확인 요청을 보냈습니다.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingSafetyId(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">불러오는 중...</p>;

  const pendingSentCount = sent.filter((s) => s.status === "PENDING").length;

  // 화면에 한 목록으로 합쳐서 보여줄 항목들: 등록된 가족(ACCEPTED) + 내가 보낸 대기중 요청(PENDING)
  const combinedList = [
    ...families.map((f) => ({ ...f, kind: "ACCEPTED" })),
    ...sent.filter((s) => s.status === "PENDING").map((s) => ({ ...s, kind: "PENDING_SENT" })),
  ];

  return (
    <div className="space-y-6">
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <h2 className="text-xl font-extrabold text-[#0F2540]">가족 관리</h2>
        <p className="text-sm text-slate-500">가족을 등록하고 안전확인 요청을 보낼 수 있습니다.</p>
      </div>

      {/* 통계 카드 2개 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">등록된 가족</p>
            <p className="text-xl font-extrabold text-[#0F2540]">{families.length}명</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">대기 중인 요청</p>
            <p className="text-xl font-extrabold text-[#0F2540]">{received.length}건</p>
          </div>
        </div>
      </div>

      {/* 나한테 온 요청 - 수락 필요 (실사용에 꼭 필요한 부분이라 별도로 눈에 띄게) */}
      {received.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5">
          <h3 className="font-bold text-[#0F2540] mb-3">나한테 온 요청 - 수락 대기</h3>
          <ul className="space-y-2">
            {received.map((r) => (
              <li key={r.relationId} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-700">
                  {r.familyMemberName} <span className="text-slate-400">({r.familyMemberLoginId})</span> · {r.relationType}(으)로 등록 요청
                </span>
                <button
                  onClick={() => accept(r.relationId)}
                  className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5"
                >
                  수락
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 가족 추가하기 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-[#0F2540] mb-1 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><UserPlus className="w-4 h-4" /></span>
          가족 추가하기
        </h3>
        <p className="text-xs text-slate-400 mb-3 ml-9">함께할 가족의 로그인 ID를 검색하여 가족 등록 요청을 보낼 수 있습니다.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="상대방 로그인ID를 입력하세요"
              className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
            />
            {(searchQuery || searchResults.length > 0) && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 text-sm focus:outline-none focus:border-[#0F2540]"
          >
            {RELATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="text-sm font-semibold text-white bg-[#0F2540] hover:bg-[#1B3A5C] rounded-lg px-4 disabled:opacity-50"
          >
            검색
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">검색 결과</p>
            <ul className="space-y-2">
              {searchResults.map((m) => (
                <li key={m.memberId} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-500">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{m.name} ({m.loginId})</span>
                  </div>
                  <button
                    onClick={() => sendRequest(m.loginId)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg px-3 py-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 가족 요청 보내기
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 등록된 가족 + 보낸 요청(대기중) 통합 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#0F2540]">등록된 가족 {families.length > 0 && `${families.length}명`}</h3>
        </div>
        {familiesLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : combinedList.length === 0 ? (
          <p className="text-sm text-slate-400">등록된 가족이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {combinedList.map((f) => {
              const isPending = f.kind === "PENDING_SENT";
              const status = !isPending ? latestStatusFor(f.familyMemberId) : null;
              return (
                <li key={f.relationId} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-700">
                          {f.familyMemberName} <span className="text-slate-400 font-normal">({f.familyMemberLoginId})</span>
                        </span>
                        {isPending ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">대기중</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">가족</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {f.relationType} · {formatDateTime(f.createdAt)} {isPending ? "요청" : "등록"}
                        {f.familyMemberPhone && ` · ${f.familyMemberPhone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isPending && status && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SAFETY_STATUS_STYLE[status]}`}>
                        {SAFETY_STATUS_LABEL[status]}
                      </span>
                    )}
                    {isPending ? (
                      <button
                        onClick={() => remove(f.relationId)}
                        className="text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5"
                      >
                        요청 취소
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => requestSafetyCheck(f.familyMemberId)}
                          disabled={requestingSafetyId === f.familyMemberId}
                          className="flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg px-3 py-1.5 disabled:opacity-50"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> 안전확인 요청
                        </button>
                        <button
                          onClick={() => remove(f.relationId)}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 삭제
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 안내 박스 */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-5">
        <h3 className="font-bold text-[#0F2540] mb-2">가족 관리 안내</h3>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>가족 등록은 상대방의 동의(수락)가 필요합니다.</li>
          <li>등록된 가족에게는 언제든지 안전확인 요청을 보낼 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}


// ---- 안전확인 이력 --------------------------------------------------------------

function SafetyTab({ sentChecks, receivedChecks, onChanged }) {
  const [error, setError] = useState("");

  const respond = async (checkId, status) => {
    try {
      await authFetch(`/api/safety-checks/${checkId}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingReceived = receivedChecks.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6 max-w-lg">
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {pendingReceived.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#0F2540] p-5">
          <h3 className="font-bold text-[#0F2540] mb-3">응답이 필요한 요청</h3>
          <ul className="space-y-3">
            {pendingReceived.map((c) => (
              <li key={c.checkId} className="p-3 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-700 mb-0.5">
                  {c.requesterName}님이 안전확인을 요청했어요
                  {c.incidentTitle && ` (${c.incidentTitle})`}
                </p>
                <p className="text-xs text-slate-400 mb-2">{formatDateTime(c.requestedAt)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(c.checkId, "SAFE")}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg py-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> 안전해요
                  </button>
                  <button
                    onClick={() => respond(c.checkId, "HELP")}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg py-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> 도움 필요
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-[#0F2540] mb-3">내가 보낸 요청</h3>
        {sentChecks.length === 0 ? (
          <p className="text-sm text-slate-400">보낸 요청이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {sentChecks.map((c) => (
              <li key={c.checkId} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm text-slate-700">
                    {c.targetMemberName}{c.incidentTitle && ` · ${c.incidentTitle}`}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDateTime(c.requestedAt)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${SAFETY_STATUS_STYLE[c.status]}`}>
                  {SAFETY_STATUS_LABEL[c.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-[#0F2540] mb-3">내가 받은 요청</h3>
        {receivedChecks.length === 0 ? (
          <p className="text-sm text-slate-400">받은 요청이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {receivedChecks.map((c) => (
              <li key={c.checkId} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm text-slate-700">
                    {c.requesterName}{c.incidentTitle && ` · ${c.incidentTitle}`}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDateTime(c.requestedAt)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${SAFETY_STATUS_STYLE[c.status]}`}>
                  {SAFETY_STATUS_LABEL[c.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- 관심 지역 --------------------------------------------------------------

// ---- 내 제보 내역 --------------------------------------------------------------

const REPORT_STATUS_FILTERS = [
  { key: "all", label: "전체" },
  { key: "pending", label: "접수 대기" },
  { key: "progress", label: "진행중" },
  { key: "closed", label: "종료" },
];

function ReportsTab({ reports, loading, onChanged }) {
  const [incidentInfo, setIncidentInfo] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const uniqueIds = [...new Set(reports.filter((r) => r.incidentId).map((r) => r.incidentId))];
    uniqueIds.forEach((id) => {
      if (!incidentInfo[id]) {
        authFetch(`/api/incidents/${id}`)
          .then((data) => setIncidentInfo((prev) => ({ ...prev, [id]: data })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  const statusOf = (report) => {
    if (!report.incidentId) return { label: "접수 대기", style: "bg-slate-100 text-slate-500", group: "pending" };
    const incident = incidentInfo[report.incidentId];
    if (!incident) return { label: "확인 중...", style: "bg-slate-100 text-slate-400", group: "progress" };
    if (incident.status === "CLOSED") return { label: "종료", style: "bg-emerald-100 text-emerald-700", group: "closed" };
    return { label: STATUS_LABEL_KO[incident.status] || incident.status, style: "bg-sky-100 text-sky-700", group: "progress" };
  };

  const filtered = reports.filter((r) => filter === "all" || statusOf(r).group === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[#0F2540]">내 제보 내역</h2>
        <p className="text-sm text-slate-500">내가 등록한 현장제보와 처리 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="flex gap-2">
        {REPORT_STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              filter === key ? "bg-[#0F2540] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {loading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-slate-400">해당하는 제보가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((r) => {
              const status = statusOf(r);
              return (
                <li key={r.reportId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-700">{r.disasterType}</span>
                      <span className="text-[10px] text-slate-400">제보 #{r.reportId}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{r.content || "-"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${status.style}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


function RegionsTab({ regions, onChanged }) {
  const [newRegion, setNewRegion] = useState("");
  const [error, setError] = useState("");

  const addRegion = async (e) => {
    e.preventDefault();
    if (!newRegion.trim()) return;
    try {
      await authFetch("/api/mypage/regions", {
        method: "POST",
        body: JSON.stringify({ regionName: newRegion, isPrimary: regions.length === 0 }),
      });
      setNewRegion("");
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeRegion = async (memberRegionId) => {
    try {
      await authFetch(`/api/mypage/regions/${memberRegionId}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-lg">
      <h3 className="font-bold text-[#0F2540] mb-1">관심 지역</h3>
      <p className="text-xs text-slate-400 mb-4">등록한 지역의 재난 알림을 우선적으로 받습니다.</p>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

      <form onSubmit={addRegion} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newRegion}
          onChange={(e) => setNewRegion(e.target.value)}
          placeholder="예: 대전 유성구"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F2540]"
        />
        <button type="submit" className="text-sm font-semibold text-white bg-[#0F2540] hover:bg-[#1B3A5C] rounded-lg px-4">
          추가
        </button>
      </form>

      {regions.length === 0 ? (
        <p className="text-sm text-slate-400">등록된 관심지역이 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <span key={r.memberRegionId} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-full pl-3 pr-2 py-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {r.regionName}
              {r.isPrimary === "Y" && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">대표</span>}
              <button onClick={() => removeRegion(r.memberRegionId)} className="text-slate-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 알림 설정 --------------------------------------------------------------

function NotifyTab({ member: initialMember, memberLoading, memberError, onSaved }) {
  const [draft, setDraft] = useState(initialMember);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMember) setDraft(initialMember);
  }, [initialMember]);

  const toggle = (field) => {
    setDraft((prev) => ({ ...prev, [field]: prev[field] === "Y" ? "N" : "Y" }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await authFetch("/api/mypage/notifications", {
        method: "PUT",
        body: JSON.stringify({
          emailNotifyEnabled: draft.emailNotifyEnabled,
          disasterNotifyEnabled: draft.disasterNotifyEnabled,
          reportNotifyEnabled: draft.reportNotifyEnabled,
        }),
      });
      setSuccess("저장되었습니다.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (memberLoading) return <p className="text-sm text-slate-400">불러오는 중...</p>;
  if (!draft) return <p className="text-sm text-red-500">{memberError || "정보를 불러오지 못했습니다."}</p>;

  const items = [
    { field: "emailNotifyEnabled", label: "가족 안전확인 이메일 알림", desc: "가족이 안전확인을 요청하면 이메일로 받습니다." },
    { field: "disasterNotifyEnabled", label: "관심지역 재난 알림", desc: "등록한 관심지역에 재난이 발생하면 알림을 받습니다." },
    { field: "reportNotifyEnabled", label: "내 제보 상태변경 알림", desc: "내가 등록한 제보의 처리 상태가 바뀌면 알림을 받습니다." },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-lg">
      <h3 className="font-bold text-[#0F2540] mb-4">알림 설정</h3>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
      {success && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mb-3">{success}</p>}

      <div className="space-y-4 mb-5">
        {items.map(({ field, label, desc }) => (
          <div key={field} className="flex items-center justify-between">
            <div className="pr-4">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <button
              onClick={() => toggle(field)}
              className={`shrink-0 w-11 h-6 rounded-full transition relative ${
                draft[field] === "Y" ? "bg-[#0F2540]" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${
                  draft[field] === "Y" ? "left-5.5 translate-x-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-[#0F2540] hover:bg-[#1B3A5C] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
