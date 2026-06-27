import { useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

export default function Account() {
  const { user, updateProfile, changeAccountPassword } = useAppData();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-blue-600">Account</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            계정 설정
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            로그인 사용자 이름과 비밀번호를 관리합니다.
          </p>
        </div>

        {(message || error) && (
          <div
            className={`rounded-lg border p-4 text-sm font-bold ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">프로필</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAction(
                () => updateProfile(name),
                "프로필이 저장되었습니다.",
              );
            }}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-bold text-slate-700">이름</span>
              <input
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">이메일</span>
              <input
                value={user?.email ?? ""}
                disabled
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                프로필 저장
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">비밀번호 변경</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAction(async () => {
                await changeAccountPassword(currentPassword, nextPassword);
                setCurrentPassword("");
                setNextPassword("");
              }, "비밀번호가 변경되었습니다.");
            }}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-bold text-slate-700">현재 비밀번호</span>
              <input
                type="password"
                value={currentPassword}
                required
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">새 비밀번호</span>
              <input
                type="password"
                value={nextPassword}
                minLength={8}
                required
                onChange={(event) => setNextPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        </section>
      </div>
    </MainLayout>
  );
}
