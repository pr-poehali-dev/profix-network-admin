export type Role = "manager" | "client" | "tech";
export type AuthMethod = "otp" | "password";
export type Screen = "roles" | "form" | "mfa" | "totp" | "register" | "register_done" | "forgot" | "reset_sent" | "reset_confirm" | "reset_done";

export const ROLES = [
  {
    key: "client" as Role,
    label: "Личный кабинет",
    desc: "Клиент — заявки, чат с менеджером",
    icon: "User",
    grad: "from-blue-500 to-blue-600",
    accent: "border-blue-400 bg-blue-50 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "tech" as Role,
    label: "Портал специалиста",
    desc: "Технический специалист — управление заявками",
    icon: "Wrench",
    grad: "from-[#3ca615] to-[#2d8a10]",
    accent: "border-green-400 bg-green-50 text-green-700",
    btn: "bg-[#3ca615] hover:bg-[#2d8a10]",
  },
  {
    key: "manager" as Role,
    label: "Панель управления",
    desc: "Менеджер или администратор — полный CRM",
    icon: "LayoutDashboard",
    grad: "from-gray-700 to-gray-900",
    accent: "border-gray-400 bg-gray-50 text-gray-700",
    btn: "bg-gray-800 hover:bg-gray-900",
  },
];
