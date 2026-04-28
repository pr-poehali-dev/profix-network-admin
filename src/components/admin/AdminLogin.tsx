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
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4 font-golos">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md mx-auto mt-20">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#3ca615" }}
          >
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900">ProFiX</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель управления</h1>

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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent text-sm"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#3ca615" }}
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
