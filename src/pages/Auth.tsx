import { useState } from "react";
import authNatureHomes from "../assets/auth-nature-homes.png";
import BrandLogo from "../components/BrandLogo";
import { useAppData } from "../context/AppContext";
import { requestPasswordReset } from "../lib/api";

type AuthMode = "login" | "register" | "forgot";

export default function Auth() {
  const { loginWithPassword, registerWithPassword } = useAppData();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setTemporaryPassword("");
    setIsSubmitting(true);

    try {
      if (isForgot) {
        const result = await requestPasswordReset(email);
        setTemporaryPassword(result.temporaryPassword);
        setNotice("임시 비밀번호가 발급되었습니다. 아래 비밀번호로 로그인하세요.");
        return;
      }

      if (isRegister) {
        await registerWithPassword(name, email, password);
      } else {
        await loginWithPassword(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
    setTemporaryPassword("");
  };

  return (
    <div className="grid min-h-screen bg-[#f6f7fb] lg:grid-cols-[1.05fr_0.95fr]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-slate-950 bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: `url(${authNatureHomes})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/78 to-slate-950/30" />
        <div className="absolute inset-0 bg-slate-950/20" />

        <div className="relative">
          <BrandLogo variant="light" />
        </div>

        <div className="relative max-w-xl">
          <p className="text-sm font-bold text-blue-300">임대 관리의 기준</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            건물, 호실, 계약, 수납을 하나의 흐름으로 관리하세요.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            운영자는 오늘 처리해야 할 미납, 공실, 계약 만료를 빠르게 확인하고 다음 액션으로 이동할 수 있습니다.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          <Metric label="수납관리" value="월세" />
          <Metric label="공실관리" value="호실" />
          <Metric label="계약관리" value="만료" />
        </div>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-black text-blue-600">하우스렌트</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              임대 관리 시작하기
            </h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <div>
              <p className="text-sm font-bold text-blue-600">
                {isRegister
                  ? "새 계정"
                  : isForgot
                    ? "계정 복구"
                    : "다시 오신 것을 환영합니다"}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {isRegister
                  ? "계정 만들기"
                  : isForgot
                    ? "비밀번호 찾기"
                    : "로그인"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {isForgot
                  ? "가입 이메일을 입력하면 임시 비밀번호를 발급합니다."
                  : "내 건물과 호실 데이터를 안전하게 저장합니다."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <Field
                  label="이름"
                  value={name}
                  onChange={setName}
                  placeholder="홍길동"
                  autoComplete="name"
                />
              )}
              <Field
                label="이메일"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="owner@example.com"
                autoComplete="email"
              />
              {!isForgot && (
                <Field
                  label="비밀번호"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="8자 이상"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  passwordVisible={showPassword}
                  onTogglePasswordVisibility={() => setShowPassword((visible) => !visible)}
                />
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {notice}
                </p>
              )}
              {temporaryPassword && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold text-blue-700">임시 비밀번호</p>
                  <p className="mt-2 select-all rounded-md bg-white px-3 py-2 font-mono text-sm font-black text-slate-950">
                    {temporaryPassword}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting
                  ? "처리 중"
                  : isRegister
                    ? "회원가입"
                    : isForgot
                      ? "임시 비밀번호 발급"
                      : "로그인"}
              </button>
            </form>

            <div className="mt-5 grid gap-2 text-center text-sm font-bold">
              {isForgot ? (
                <button type="button" onClick={() => switchMode("login")} className="text-blue-600">
                  로그인으로 돌아가기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode(isRegister ? "login" : "register")}
                  className="text-blue-600"
                >
                  {isRegister ? "이미 계정이 있습니다" : "새 계정 만들기"}
                </button>
              )}
              {!isRegister && !isForgot && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-slate-500 hover:text-slate-950"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  passwordVisible,
  onTogglePasswordVisibility,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  passwordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
}) {
  const hasPasswordToggle = Boolean(onTogglePasswordVisibility);

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          required
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 ${
            hasPasswordToggle ? "pr-12" : ""
          }`}
        />
        {hasPasswordToggle && (
          <button
            type="button"
            aria-label={passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
            title={passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
            onClick={onTogglePasswordVisibility}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M10.6 10.6A2 2 0 0 0 13.4 13.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M8.4 5.5A10.3 10.3 0 0 1 12 5c6 0 9.5 7 9.5 7a16.7 16.7 0 0 1-2.7 3.5M6.1 6.8C3.8 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.2 0 2.3-.3 3.3-.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
