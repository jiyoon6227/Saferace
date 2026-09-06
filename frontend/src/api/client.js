const BASE_URL = "http://localhost:8080";

// 로그인 시 저장해둔 토큰을 모든 요청에 자동으로 실어 보내는 공통 함수
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("인증이 필요하거나 권한이 없습니다.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "요청 처리 중 오류가 발생했습니다.");
  }

  return res.json();
}

// 사진 등 파일 업로드용. Content-Type은 지정하지 않음 — FormData를 body로 넘기면
// 브라우저가 boundary 포함된 multipart/form-data 헤더를 알아서 만들어주는데,
// 여기서 "application/json" 같은 값을 강제로 넣으면 그게 깨져버림.
export async function authUpload(path, formData) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("인증이 필요하거나 권한이 없습니다.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "파일 업로드 중 오류가 발생했습니다.");
  }

  return res.json();
}

// JWT는 "헤더.내용.서명" 구조라, 가운데 부분(내용)만 base64 디코딩하면
// 토큰 만들 때 넣었던 memberId, role을 서버 호출 없이 바로 꺼내볼 수 있음
export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { memberId: Number(payload.sub), role: payload.role };
  } catch {
    return null;
  }
}