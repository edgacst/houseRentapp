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
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-blue-600">HOUSERENT</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {isRegister ? "계정 만들기" : "로그인"}
          </h1>
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
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
          className="mt-5 w-full text-center text-sm font-semibold text-blue-600"
        >
          {isRegister ? "이미 계정이 있습니다" : "새 계정 만들기"}
        </button>
      </div>
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
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}
