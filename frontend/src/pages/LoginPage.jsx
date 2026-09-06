import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function LoginPage({ onLoginSuccess, onBackToHome, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"

  // 로그인 필드
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // 회원가입 전용 필드
  const [name, setName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (id, pw) => {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: id, password: pw }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "로그인에 실패했습니다.");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    onLoginSuccess(data.token);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await doLogin(loginId, password);
    } catch (err) {
      setError(err.message || "아이디 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (name.trim() === "") {
      setError("이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }
      // 회원가입 성공 → 같은 계정으로 바로 로그인까지 처리
      await doLogin(loginId, password);
    } catch (err) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#0F2540] flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6 text-amber-400" strokeWidth={2.5} />
          </div>
          <div className="font-extrabold text-lg text-[#0F2540]">세이프트레이스</div>
        </div>

        {/* 탭 전환 */}
        <div className="flex mb-6 border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 text-sm font-bold ${mode === "login" ? "bg-[#0F2540] text-white" : "bg-white text-slate-500"}`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 text-sm font-bold ${mode === "signup" ? "bg-[#0F2540] text-white" : "bg-white text-slate-500"}`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={mode === "login" ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">아이디</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F2540]"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F2540]"
                placeholder="이름을 입력하세요"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F2540]"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F2540]"
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F2540] hover:bg-[#1B3A5C] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          onClick={onBackToHome}
          className="w-full text-center text-xs text-slate-400 mt-4 hover:text-slate-600"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}