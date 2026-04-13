import React, { createContext, useEffect, useMemo, useState } from "react";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("spark_theme") || "light");
  const [lang, setLang] = useState(() => localStorage.getItem("spark_lang") || "en");

  useEffect(() => {
    localStorage.setItem("spark_theme", theme);
    localStorage.setItem("spark_lang", lang);

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [theme, lang]);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));
  const toggleLang = () => setLang((p) => (p === "en" ? "ar" : "en"));

  const DICT = useMemo(
    () => ({
      en: {
        // menu
        theme: "Theme mode",
        language: "Language",
        resetPassword: "Reset Password",
        logout: "Logout",
        // shared
        hi: "Hi",
        open: "Open",
        close: "Close",
        // home
        heroTitleA: "Your ideas deserve a",
        heroTitleB: "safe space",
        heroTitleC: "to grow.",
        heroDesc:
          "SparkUp protects, supports, and elevates your innovation journey. Log in to start managing your ideas securely.",
        getStarted: "Get Started",
        menu: "Menu",
        adminLogin: "Admin Login",
        aboutUs: "About Us",
        contactUs: "Contact Us",
        // roles
        reviewer: "Reviewer",
        funder: "Funder",
        innovator: "Innovator",
      },
      ar: {
        // menu
        theme: "الوضع",
        language: "اللغة",
        resetPassword: "إعادة تعيين كلمة المرور",
        logout: "تسجيل الخروج",
        // shared
        hi: "مرحباً",
        open: "فتح",
        close: "إغلاق",
        // home
        heroTitleA: "أفكارك تستحق",
        heroTitleB: "مساحة آمنة",
        heroTitleC: "لتنمو.",
        heroDesc:
          "SparkUp يحمي ويدعم ويطور رحلتك الابتكارية. قم بتسجيل الدخول لبدء إدارة أفكارك بأمان.",
        getStarted: "ابدأ الآن",
        menu: "القائمة",
        adminLogin: "دخول الإدارة",
        aboutUs: "من نحن",
        contactUs: "تواصل معنا",
        // roles
        reviewer: "مراجع",
        funder: "ممّول",
        innovator: "مبتكر",
      },
    }),
    []
  );

  const t = useMemo(() => (key) => DICT[lang]?.[key] ?? key, [lang, DICT]);

  //one place for theme colors (used by ALL pages)
  const palette = useMemo(() => {
    const dark = theme === "dark";
    return {
      isDark: dark,
      bg: dark ? "#0b1220" : "linear-gradient(180deg, #F7FAFF 0%, #EEF6FF 100%)",
      surface: dark ? "#0f172a" : "#ffffff",
      surface2: dark ? "#111c33" : "rgba(234,244,255,0.9)",
      text: dark ? "#e5e7eb" : "#0f2e4d",
      muted: dark ? "#94a3b8" : "#3b5877",
      border: dark ? "rgba(148,163,184,0.22)" : "rgba(26,77,128,0.12)",
      btnBg: dark ? "#111c33" : "#ffffff",
    };
  }, [theme]);

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, toggleLang, t, palette }}>
      {children}
    </AppContext.Provider>
  );
}