import Icon from "@/components/ui/icon";

interface Props {
  loginForm: { login: string; password: string };
  loading: boolean;
  error: string;
  onChangeForm: (f: { login: string; password: string }) => void;
  onLogin: () => void;
}

export default function AdminLogin({ loginForm, loading, error, onChangeForm, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4 font-golos">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 w-full max-w-md mx-auto mt-20">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-oswald text-xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </div>
        <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">ProFiX Admin</p>
        <h1 className="font-oswald text-3xl font-bold text-[#0D1B2A] mb-6">Панель управления</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <input
              type="text"
              value={loginForm.login}
              onChange={(e) => onChangeForm({ ...loginForm, login: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && onLogin()}
              placeholder="Введите логин"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => onChangeForm({ ...loginForm, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && onLogin()}
              placeholder="Введите пароль"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615] text-sm"
            />
          </div>
          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#3ca615] text-white font-semibold text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                Вход...
              </>
            ) : (
              "Войти"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}