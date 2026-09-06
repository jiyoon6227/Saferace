import React, { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, ArrowLeft } from "lucide-react";
import { authFetch } from "../api/client";

const STATUS_LABEL = {
  RECEIVED: "접수",
  CONFIRMING: "확인중",
  RESPONDING: "대응중",
  RECOVERING: "복구중",
  CLOSED: "종료",
};

const STATUS_STYLE = {
  RECEIVED: "bg-slate-100 text-slate-600",
  CONFIRMING: "bg-blue-100 text-blue-700",
  RESPONDING: "bg-amber-100 text-amber-700",
  RECOVERING: "bg-purple-100 text-purple-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
};

export default function StaffDashboard({ onBackToHome }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIncidents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/api/incidents");
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0F2540] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span className="font-bold">STAFF 대시보드</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadIncidents}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 홈으로
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">제목</th>
                  <th className="text-left px-4 py-3">유형</th>
                  <th className="text-left px-4 py-3">지역</th>
                  <th className="text-left px-4 py-3">위험도</th>
                  <th className="text-left px-4 py-3">상태</th>
                  <th className="text-left px-4 py-3">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-8">
                      등록된 Incident가 없습니다.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.incidentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">#{inc.incidentId}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{inc.title}</td>
                      <td className="px-4 py-3 text-slate-500">{inc.disasterType}</td>
                      <td className="px-4 py-3 text-slate-500">{inc.region}</td>
                      <td className="px-4 py-3 text-slate-500">{inc.severity}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLE[inc.status] || ""}`}>
                          {STATUS_LABEL[inc.status] || inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {inc.assignedStaffId ? `#${inc.assignedStaffId}` : "미배정"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}