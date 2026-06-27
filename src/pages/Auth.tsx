import { useState } from "react";
import { useAppData } from "../context/AppContext";

export default function Auth() {
  const { loginWithPassword, registerWithPassword } = useAppData();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await registerWithPassword(name, email, password);
      } else {
        await loginWithPassword(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f6f7fb] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden min-h-screen bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-sm font-black text-slate-950">
            HR
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">HOUSERENT</p>
            <p className="text-sm text-slate-400">Rental operations platform</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-bold text-blue-300">임대 관리의 기준점</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            건물, 호실, 계약, 수납을 하나의 흐름으로 관리하세요.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            운영자는 오늘 처리해야 할 미납, 공실, 계약 만료를 빠르게
            확인하고 다음 액션으로 이동할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="수납관리" value="월세" />
          <Metric label="공실관리" value="호실" />
          <Metric label="계약관리" value="만료" />
        </div>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-black text-blue-600">HOUSERENT</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              임대 관리 시작하기
            </h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <div>
              <p className="text-sm font-bold text-blue-600">
                {isRegister ? "새 계정" : "다시 오신 것을 환영합니다"}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {isRegister ? "계정 만들기" : "로그인"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                내 건물과 호실 데이터를 안전하게 저장합니다.
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
              <Field
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="8자 이상"
                autoComplete={isRegister ? "new-password" : "current-password"}
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "처리 중" : isRegister ? "회원가입" : "로그인"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
              }}
              className="mt-5 w-full text-center text-sm font-bold text-blue-600"
            >
              {isRegister ? "이미 계정이 있습니다" : "새 계정 만들기"}
            </button>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}
