"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface User {
  id: string;
  email: string;
  displayName: string;
  pointsBalance: number;
  totalEarned: number;
  surveysCompleted: number;
  level: number;
  xp: number;
  streak: number;
  referralCode: string;
  darkMode: boolean;
}
interface Transaction {
  id: string; type: string; points: number; currencyAmount: number;
  status: string; referenceId: string | null; description: string | null; createdAt: string;
}
interface Notification {
  id: string; title: string; message: string; read: boolean; createdAt: string;
}
interface AdminUser {
  id: string; email: string; displayName: string; pointsBalance: number;
  totalEarned: number; surveysCompleted: number; level: number; referralCode: string; createdAt: string;
}
interface AdminStats { totalUsers: number; totalPoints: number; totalSurveys: number; }
type TabName = "home" | "surveys" | "rewards" | "referrals" | "profile" | "admin";
type AuthView = "login" | "register";

const ADMIN_EMAIL = "honesttech237@gmail.com";
const POINTS_PER_DOLLAR = 1000;

/* ═══════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════ */
const Icon = {
  Home: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Survey: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Gift: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  User: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Coin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a2.5 2.5 0 010 5H9"/></svg>,
  Fire: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-5 6-5 11a5 5 0 0010 0c0-5-5-11-5-11z"/><path d="M12 2s2 4 2 7a2 2 0 01-4 0c0-3 2-7 2-7z"/></svg>,
  Star: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  TrendUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  LogOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Moon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Sun: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Withdraw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Send: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ExternalLink: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  History: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  Award: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function pointsToUsd(points: number): string { return (points / POINTS_PER_DOLLAR).toFixed(2); }
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
export default function SurveyEaseApp() {
  const [token, setToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showSurveyWall, setShowSurveyWall] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wallUrl, setWallUrl] = useState("");
  const [surveysLoading, setSurveysLoading] = useState(false);

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [refCode, setRefCode] = useState("");

  // Admin state
  const [adminData, setAdminData] = useState<{ users: AdminUser[]; transactions: Transaction[]; stats: AdminStats } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<"users" | "transactions" | "notify">("users");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdmin = user?.email === ADMIN_EMAIL;

  const showToast = useCallback((message: string, type = "info") => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(url, { ...options, headers });
  }, [accessToken]);

  const loadUser = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setToken(null); setAccessToken(null);
      }
    } catch { /* ignore */ }
  }, [accessToken, apiFetch]);

  const loadTransactions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch("/api/user/transactions");
      if (res.ok) { const data = await res.json(); setTxns(data.transactions || []); }
    } catch { /* ignore */ }
  }, [accessToken, apiFetch]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch("/api/user/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, [accessToken, apiFetch]);

  const loadSurveys = useCallback(async () => {
    if (!accessToken) return;
    setSurveysLoading(true);
    try {
      const res = await apiFetch("/api/surveys");
      if (res.ok) {
        const data = await res.json();
        if (data.wallUrl) setWallUrl(data.wallUrl);
      }
    } catch { /* ignore */ }
    setSurveysLoading(false);
  }, [accessToken, apiFetch]);

  const loadAdminData = useCallback(async () => {
    if (!accessToken) return;
    setAdminLoading(true);
    try {
      const res = await apiFetch("/api/admin");
      if (res.ok) { const data = await res.json(); setAdminData(data); }
    } catch { /* ignore */ }
    setAdminLoading(false);
  }, [accessToken, apiFetch]);

  // Init — Supabase session
  useEffect(() => {
    const dm = localStorage.getItem("surveyease_dark") === "true";
    setDarkMode(dm);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setToken(session.user.id); setAccessToken(session.access_token); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setToken(session.user.id); setAccessToken(session.access_token); }
      else { setToken(null); setAccessToken(null); setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("surveyease_dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (accessToken) {
      loadUser(); loadTransactions(); loadNotifications(); loadSurveys();
    }
  }, [accessToken, loadUser, loadTransactions, loadNotifications, loadSurveys]);

  useEffect(() => {
    if (activeTab === "admin" && isAdmin && !adminData) loadAdminData();
  }, [activeTab, isAdmin, adminData, loadAdminData]);

  // Auth
  const handleRegister = async () => {
    if (!email || !password) return showToast("Please fill all fields", "error");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, referralCode: refCode }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Registration failed", "error"); setAuthLoading(false); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
      if (signInError) showToast(signInError.message, "error");
      else showToast("Welcome to SurveyEase! 500 bonus points added.", "success");
    } catch { showToast("Network error", "error"); }
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast("Please fill all fields", "error");
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
      if (error) { showToast(error.message || "Login failed", "error"); setAuthLoading(false); return; }
      if (data.session) {
        const tok = data.session.access_token;
        setToken(data.session.user.id);
        setAccessToken(tok);
        try {
          const res = await fetch("/api/user/me", { headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" } });
          if (res.ok) { const d = await res.json(); setUser(d.user); showToast("Welcome back!", "success"); }
          else { showToast("Profile not found. Please register first.", "error"); await supabase.auth.signOut(); setToken(null); setAccessToken(null); }
        } catch { showToast("Network error loading profile", "error"); }
      }
    } catch { showToast("Network error", "error"); }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTxns([]); setNotifs([]); setActiveTab("home");
    showToast("Signed out", "info");
  };

  const markNotificationsRead = async () => {
    await apiFetch("/api/user/notifications", { method: "PUT" });
    setUnreadCount(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Admin actions
  const handleAdminAdjust = async (uid: string, pts: number) => {
    const res = await apiFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "adjust_points", userId: uid, points: pts }),
    });
    if (res.ok) { showToast(`Adjusted ${pts} points`, "success"); loadAdminData(); }
    else showToast("Failed", "error");
  };

  const handleAdminNotify = async () => {
    if (!notifTitle || !notifMessage) return showToast("Fill title and message", "error");
    const res = await apiFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "send_notification", userId: notifTarget, title: notifTitle, message: notifMessage }),
    });
    if (res.ok) { showToast("Notification sent", "success"); setNotifTitle(""); setNotifMessage(""); }
    else showToast("Failed", "error");
  };

  const handleAdminDelete = async (uid: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await apiFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "delete_user", userId: uid }),
    });
    if (res.ok) { showToast("User deleted", "success"); loadAdminData(); }
    else showToast("Failed", "error");
  };

  const xpNeeded = user ? user.level * 500 : 500;
  const xpProgress = user ? Math.min((user.xp / xpNeeded) * 100, 100) : 0;
  const cashBalance = user ? pointsToUsd(user.pointsBalance) : "0.00";
  const totalCash = user ? pointsToUsd(user.totalEarned) : "0.00";

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:"linear-gradient(135deg, #FF7A1A, #FFB74D)" }}>
      <div style={{ width:48, height:48, border:"4px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  /* ── USER LOADING (token exists but user not yet fetched) ── */
  if (token && !user) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:"linear-gradient(135deg, #FF7A1A, #FFB74D)" }}>
      <div style={{ width:48, height:48, border:"4px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  /* ── AUTH ── */
  if (!token) return (
    <div style={{ minHeight:"100dvh", background: darkMode ? "var(--bg-primary)" : "linear-gradient(180deg,#FFF5EB 0%,#FFFFFF 60%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ width:64, height:64, background:"linear-gradient(135deg,#FF7A1A,#E56A0A)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", boxShadow:"0 8px 24px rgba(255,122,26,0.3)" }}>
          <Icon.Survey />
        </div>
        <h1 style={{ fontSize:28, fontWeight:900, color:"var(--primary)", letterSpacing:-1 }}>SurveyEase</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:14, marginTop:4 }}>Earn real rewards for your opinions</p>
      </div>
      <div style={{ width:"100%", maxWidth:400, background:"var(--bg-card)", borderRadius:"var(--radius)", padding:32, boxShadow:"var(--shadow-lg)", border:"1px solid var(--border)" }}>
        <div style={{ display:"flex", gap:0, marginBottom:28, background:"var(--bg-secondary)", borderRadius:"var(--radius-xs)", padding:4 }}>
          {(["login","register"] as AuthView[]).map(v => (
            <button key={v} onClick={() => setAuthView(v)} style={{ flex:1, padding:"12px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, transition:"all 0.2s", background: authView===v ? "var(--primary)" : "transparent", color: authView===v ? "white" : "var(--text-secondary)" }}>
              {v === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        {authView === "register" && <input placeholder="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />}
        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        {authView === "register" && <input placeholder="Referral Code (optional)" value={refCode} onChange={e => setRefCode(e.target.value)} style={inputStyle} />}
        <button onClick={authView === "login" ? handleLogin : handleRegister} disabled={authLoading} style={{ width:"100%", padding:16, borderRadius:"var(--radius-xs)", background:"linear-gradient(135deg,var(--primary),var(--primary-dark))", color:"white", border:"none", fontSize:16, fontWeight:700, cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1, marginTop:8, boxShadow:"0 4px 16px rgba(255,122,26,0.3)" }}>
          {authLoading ? "Please wait..." : authView === "login" ? "Sign In" : "Create Account"}
        </button>
        {authView === "register" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:16, padding:12, background:"rgba(255,122,26,0.08)", borderRadius:10 }}>
            <div style={{ color:"var(--primary)" }}><Icon.Gift /></div>
            <span style={{ fontSize:13, color:"var(--text-secondary)" }}>Get <b style={{ color:"var(--primary)" }}>500 bonus points</b> on sign up</span>
          </div>
        )}
      </div>
      <button onClick={() => setDarkMode(!darkMode)} style={{ marginTop:20, background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:6 }}>
        {darkMode ? <Icon.Sun /> : <Icon.Moon />} {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  );

  const tabs: { id: TabName; icon: React.ReactNode; label: string }[] = [
    { id:"home", icon:<Icon.Home />, label:"Home" },
    { id:"surveys", icon:<Icon.Survey />, label:"Surveys" },
    { id:"rewards", icon:<Icon.Gift />, label:"Rewards" },
    { id:"referrals", icon:<Icon.Users />, label:"Referrals" },
    { id:"profile", icon:<Icon.User />, label:"Profile" },
    ...(isAdmin ? [{ id:"admin" as TabName, icon:<Icon.Shield />, label:"Admin" }] : []),
  ];

  return (
    <div style={{ background:"var(--bg-secondary)", minHeight:"100dvh", paddingBottom:90, maxWidth:480, margin:"0 auto", position:"relative" }}>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"var(--bg-primary)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", backdropFilter:"blur(20px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#FF7A1A,#E56A0A)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}><Icon.Survey /></div>
          <span style={{ fontWeight:800, fontSize:18, color:"var(--primary)", letterSpacing:-0.5 }}>SurveyEase</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,122,26,0.08)", padding:"7px 12px", borderRadius:50, border:"1px solid rgba(255,122,26,0.15)" }}>
            <span style={{ color:"var(--primary)" }}><Icon.Coin /></span>
            <span style={{ fontWeight:800, fontSize:14, color:"var(--primary)" }}>{formatNumber(user.pointsBalance)}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(239,68,68,0.08)", padding:"7px 10px", borderRadius:50 }}>
            <span style={{ color:"#EF4444" }}><Icon.Fire /></span>
            <span style={{ fontWeight:700, fontSize:13, color:"#EF4444" }}>{user.streak}</span>
          </div>
          <button onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markNotificationsRead(); }} style={{ position:"relative", background:"none", border:"none", cursor:"pointer", padding:4, color:"var(--text-secondary)" }}>
            <Icon.Bell />
            {unreadCount > 0 && <span style={{ position:"absolute", top:-2, right:-2, width:16, height:16, background:"#EF4444", color:"white", borderRadius:"50%", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount}</span>}
          </button>
          <button onClick={() => setActiveTab("profile")} style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,var(--primary),var(--primary-dark))", color:"white", fontSize:13, fontWeight:800, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {user.displayName[0]?.toUpperCase()}
          </button>
        </div>
      </header>

      {/* NOTIFICATION PANEL */}
      {showNotifPanel && (
        <div style={{ position:"fixed", top:60, right:8, left:8, maxWidth:460, margin:"0 auto", background:"var(--bg-card)", borderRadius:"var(--radius)", boxShadow:"var(--shadow-lg)", border:"1px solid var(--border)", zIndex:200, maxHeight:400, overflow:"auto" }} className="animate-scale-in">
          <div style={{ padding:16, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontWeight:700, fontSize:16 }}>Notifications</h3>
            <button onClick={() => setShowNotifPanel(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)" }}><Icon.X /></button>
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding:32, textAlign:"center", color:"var(--text-muted)" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8, opacity:0.4 }}><Icon.Bell /></div>
              No notifications yet
            </div>
          ) : notifs.map(n => (
            <div key={n.id} style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", opacity: n.read ? 0.6 : 1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{n.title}</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:2 }}>{n.message}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ══ HOME ══ */}
      {activeTab === "home" && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
            {[
              { label:"Available", value:"Live", icon:<Icon.Survey />, color:"#3B82F6" },
              { label:"Completed", value: String(user.surveysCompleted), icon:<Icon.Check />, color:"#10B981" },
              { label:"Earnings", value:`$${totalCash}`, icon:<Icon.TrendUp />, color:"#F59E0B" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:"16px 12px", textAlign:"center", border:"1px solid var(--border)", boxShadow:"var(--shadow)" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6, color:s.color }}>{s.icon}</div>
                <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Banner */}
          <div style={{ background:"linear-gradient(135deg,#FF7A1A 0%,#FFB74D 100%)", borderRadius:"var(--radius)", padding:24, display:"flex", alignItems:"center", gap:16, marginBottom:20, position:"relative", overflow:"hidden" }}>
            <div style={{ flex:1 }}>
              <h2 style={{ color:"white", fontWeight:800, fontSize:20, lineHeight:1.2 }}>Start Earning Today</h2>
              <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, marginTop:6, lineHeight:1.4 }}>Complete real surveys and earn real cash rewards. New surveys added daily.</p>
              <button onClick={() => { setActiveTab("surveys"); setShowSurveyWall(true); }} style={{ marginTop:12, background:"white", color:"var(--primary)", padding:"10px 20px", borderRadius:50, border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <Icon.ExternalLink /> Open Surveys
              </button>
            </div>
          </div>

          {/* Level progress */}
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:16, marginBottom:18, border:"1px solid var(--border)", boxShadow:"var(--shadow)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:"var(--primary)" }}><Icon.Star /></span>
                <span style={{ fontWeight:700, fontSize:15 }}>Level {user.level}</span>
              </div>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>{user.xp}/{xpNeeded} XP</span>
            </div>
            <div style={{ height:8, background:"var(--border)", borderRadius:50, overflow:"hidden" }}>
              <div className="animate-progress" style={{ height:"100%", width:`${xpProgress}%`, background:"linear-gradient(90deg,var(--primary),var(--accent))", borderRadius:50 }} />
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:17, marginBottom:12 }}>Recent Activity</h3>
            {txns.length === 0 ? (
              <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:32, textAlign:"center", border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:8, opacity:0.3 }}><Icon.History /></div>
                <div style={{ fontWeight:600, color:"var(--text-muted)", fontSize:14 }}>No activity yet</div>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>Complete a survey to get started</div>
              </div>
            ) : txns.slice(0,5).map(tx => (
              <div key={tx.id} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-xs)", padding:"12px 16px", marginBottom:8, border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: tx.points > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color: tx.points > 0 ? "#10B981" : "#EF4444" }}>
                    {tx.points > 0 ? <Icon.TrendUp /> : <Icon.Withdraw />}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{tx.description?.slice(0,35) || tx.type}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(tx.createdAt)}</div>
                  </div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color: tx.points > 0 ? "var(--success)" : "var(--danger)" }}>
                  {tx.points > 0 ? "+" : ""}{tx.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ SURVEYS ══ */}
      {activeTab === "surveys" && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Surveys</h2>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>Complete surveys to earn points and cash rewards</p>
          <button onClick={() => setShowSurveyWall(true)} style={{ width:"100%", padding:18, background:"linear-gradient(135deg,var(--primary),var(--primary-dark))", color:"white", borderRadius:"var(--radius-sm)", border:"none", fontWeight:700, fontSize:16, cursor:"pointer", boxShadow:"0 4px 16px rgba(255,122,26,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }} className="animate-pulse-glow">
            <Icon.ExternalLink />
            {surveysLoading ? "Loading surveys..." : "Open Live Survey Wall"}
          </button>
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:20, textAlign:"center", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8, opacity:0.4 }}><Icon.Survey /></div>
            <div style={{ fontWeight:600, fontSize:14 }}>Live surveys from RapidoReach</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>Open the survey wall to see all available surveys</div>
          </div>
        </div>
      )}

      {/* ══ REWARDS ══ */}
      {activeTab === "rewards" && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          <h2 style={{ fontWeight:800, fontSize:22, marginBottom:16 }}>Rewards</h2>
          <div style={{ background:"linear-gradient(135deg,#FF7A1A 0%,#FFB74D 100%)", borderRadius:"var(--radius)", padding:28, marginBottom:20, position:"relative", overflow:"hidden" }}>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:14, fontWeight:600 }}>Available Balance</div>
            <div style={{ color:"white", fontSize:36, fontWeight:900, marginTop:4 }}>{formatNumber(user.pointsBalance)} <span style={{ fontSize:16, fontWeight:600 }}>pts</span></div>
            <div style={{ color:"rgba(255,255,255,0.85)", fontSize:16, fontWeight:600, marginTop:2 }}>${cashBalance} USD</div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={() => setShowWithdraw(true)} style={{ background:"white", color:"var(--primary)", border:"none", padding:"10px 24px", borderRadius:50, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <Icon.Withdraw /> Withdraw
              </button>
              <button onClick={() => setActiveTab("surveys")} style={{ background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.3)", padding:"10px 24px", borderRadius:50, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Earn More
              </button>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            {[
              { label:"Total Earned", value:`$${totalCash}`, icon:<Icon.TrendUp />, color:"#10B981" },
              { label:"Surveys Done", value: String(user.surveysCompleted), icon:<Icon.Survey />, color:"#3B82F6" },
              { label:"Current Level", value:`Lvl ${user.level}`, icon:<Icon.Star />, color:"#F59E0B" },
              { label:"XP Points", value: formatNumber(user.xp), icon:<Icon.Award />, color:"#8B5CF6" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:16, border:"1px solid var(--border)", boxShadow:"var(--shadow)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ color:s.color }}>{s.icon}</span>
                  <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>{s.label}</span>
                </div>
                <div style={{ fontWeight:800, fontSize:22, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontWeight:700, fontSize:17, marginBottom:12 }}>Transaction History</h3>
          {txns.length === 0 ? (
            <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:32, textAlign:"center", border:"1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:8, opacity:0.3 }}><Icon.History /></div>
              <div style={{ fontWeight:600, color:"var(--text-muted)" }}>No transactions yet</div>
            </div>
          ) : (
            <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 60px", padding:"10px 14px", background:"var(--bg-secondary)", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase" }}>
                <div>Description</div><div style={{ textAlign:"center" }}>Points</div><div style={{ textAlign:"center" }}>Status</div><div style={{ textAlign:"right" }}>Date</div>
              </div>
              {txns.map(tx => (
                <div key={tx.id} style={{ display:"grid", gridTemplateColumns:"1fr 80px 80px 60px", padding:"10px 14px", borderBottom:"1px solid var(--border)", fontSize:12, alignItems:"center" }}>
                  <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, fontWeight:500 }}>{tx.description || tx.type}</div>
                  <div style={{ textAlign:"center", fontWeight:700, color: tx.points > 0 ? "var(--success)" : "var(--danger)" }}>{tx.points > 0 ? "+" : ""}{tx.points}</div>
                  <div style={{ textAlign:"center" }}>
                    <span style={{ padding:"2px 8px", borderRadius:50, fontSize:10, fontWeight:700, background: tx.status==="COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: tx.status==="COMPLETED" ? "#10B981" : "#F59E0B" }}>{tx.status}</span>
                  </div>
                  <div style={{ textAlign:"right", color:"var(--text-muted)", fontSize:11 }}>{timeAgo(tx.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ REFERRALS ══ */}
      {activeTab === "referrals" && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Referral Program</h2>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>Invite friends and earn bonus rewards together</p>
          <div style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius:"var(--radius)", padding:24, marginBottom:20 }}>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:14, fontWeight:600, marginBottom:4 }}>Your Referral Code</div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, border:"1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ color:"white", fontWeight:800, fontSize:20, letterSpacing:2 }}>{user.referralCode}</span>
              <button onClick={() => { navigator.clipboard?.writeText(user.referralCode || ""); showToast("Code copied", "success"); }} style={{ background:"white", color:"#6366F1", border:"none", padding:"6px 14px", borderRadius:50, fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                <Icon.Copy /> Copy
              </button>
            </div>
            <button onClick={() => {
              const text = `Join SurveyEase and earn rewards! Use my referral code: ${user.referralCode}`;
              if (navigator.share) navigator.share({ title:"SurveyEase", text }).catch(() => {});
              else { navigator.clipboard?.writeText(text); showToast("Share link copied", "success"); }
            }} style={{ background:"white", color:"#6366F1", border:"none", padding:"10px 20px", borderRadius:50, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Icon.Share /> Share Invite
            </button>
          </div>
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:20, border:"1px solid var(--border)" }}>
            <h3 style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>How It Works</h3>
            {[
              { step:1, title:"Share Your Code", desc:"Send your unique referral code to friends", icon:<Icon.Share /> },
              { step:2, title:"Friend Signs Up", desc:"They create an account using your code", icon:<Icon.User /> },
              { step:3, title:"Both Earn Rewards", desc:"You get 500 pts, they get 500 pts welcome bonus", icon:<Icon.Gift /> },
            ].map(s => (
              <div key={s.step} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:"rgba(99,102,241,0.08)", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366F1", flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>Step {s.step}: {s.title}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ PROFILE ══ */}
      {activeTab === "profile" && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius)", padding:24, textAlign:"center", marginBottom:20, border:"1px solid var(--border)", boxShadow:"var(--shadow)" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 12px", background:"linear-gradient(135deg,var(--primary),var(--primary-dark))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"white", boxShadow:"0 4px 16px rgba(255,122,26,0.3)" }}>
              {user.displayName[0]?.toUpperCase()}
            </div>
            <h2 style={{ fontWeight:800, fontSize:20 }}>{user.displayName}</h2>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginTop:2 }}>{user.email}</p>
            {isAdmin && <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:8, padding:"4px 12px", background:"rgba(255,122,26,0.1)", borderRadius:50, fontSize:12, fontWeight:700, color:"var(--primary)" }}><Icon.Shield /> Admin</span>}
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:12 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 12px", background:"rgba(255,122,26,0.08)", borderRadius:50, fontSize:12, fontWeight:700, color:"var(--primary)" }}><Icon.Star /> Level {user.level}</span>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 12px", background:"rgba(239,68,68,0.08)", borderRadius:50, fontSize:12, fontWeight:700, color:"#EF4444" }}><Icon.Fire /> {user.streak} Day Streak</span>
            </div>
          </div>
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", overflow:"hidden", marginBottom:20 }}>
            {[
              { label:"Dark Mode", icon:<Icon.Moon />, action: () => setDarkMode(!darkMode), toggle:true, active:darkMode },
              { label:"Notifications", icon:<Icon.Bell />, action: () => setShowNotifPanel(true) },
              { label:"Transaction History", icon:<Icon.History />, action: () => setActiveTab("rewards") },
              { label:"Referral Program", icon:<Icon.Users />, action: () => setActiveTab("referrals") },
              ...(isAdmin ? [{ label:"Admin Panel", icon:<Icon.Shield />, action: () => setActiveTab("admin") }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", border:"none", borderBottom:"1px solid var(--border)", background:"transparent", cursor:"pointer", color:"var(--text-primary)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ color:"var(--text-secondary)" }}>{item.icon}</span>
                  <span style={{ fontWeight:600, fontSize:14 }}>{item.label}</span>
                </div>
                {"toggle" in item && item.toggle ? (
                  <div style={{ width:44, height:24, borderRadius:50, padding:2, background: item.active ? "var(--primary)" : "var(--border)", transition:"all 0.2s" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"white", transform: item.active ? "translateX(20px)" : "translateX(0)", transition:"all 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }} />
                  </div>
                ) : <span style={{ color:"var(--text-muted)" }}><Icon.ChevronRight /></span>}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} style={{ width:"100%", padding:14, borderRadius:"var(--radius-xs)", background:"rgba(239,68,68,0.08)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.2)", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Icon.LogOut /> Sign Out
          </button>
        </div>
      )}

      {/* ══ ADMIN ══ */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ padding:"16px 16px 0" }} className="animate-fade-up">
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ color:"var(--primary)" }}><Icon.Shield /></div>
            <h2 style={{ fontWeight:800, fontSize:22 }}>Admin Panel</h2>
          </div>

          {/* Stats */}
          {adminData && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { label:"Total Users", value: String(adminData.stats?.totalUsers || 0), icon:<Icon.Users />, color:"#3B82F6" },
                { label:"Total Points", value: formatNumber(adminData.stats?.totalPoints || 0), icon:<Icon.Coin />, color:"#F59E0B" },
                { label:"Surveys Done", value: String(adminData.stats?.totalSurveys || 0), icon:<Icon.Survey />, color:"#10B981" },
              ].map(s => (
                <div key={s.label} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:"14px 10px", textAlign:"center", border:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:4, color:s.color }}>{s.icon}</div>
                  <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", fontWeight:600, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Admin tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:16, background:"var(--bg-secondary)", borderRadius:"var(--radius-xs)", padding:4 }}>
            {(["users","transactions","notify"] as const).map(t => (
              <button key={t} onClick={() => setAdminTab(t)} style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, background: adminTab===t ? "var(--primary)" : "transparent", color: adminTab===t ? "white" : "var(--text-secondary)", transition:"all 0.2s", textTransform:"capitalize" }}>
                {t === "notify" ? "Notify" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {adminLoading && <div style={{ textAlign:"center", padding:32, color:"var(--text-muted)" }}>Loading...</div>}

          {/* Users list */}
          {adminTab === "users" && !adminLoading && adminData && (
            <div>
              {adminData.users.map(u => (
                <div key={u.id} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:16, marginBottom:10, border:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{u.displayName}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)" }}>{u.email}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Joined {timeAgo(u.createdAt)} · Level {u.level}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:800, color:"var(--primary)", fontSize:14 }}>{formatNumber(u.pointsBalance)} pts</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{u.surveysCompleted} surveys</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { const p = prompt("Points to add (use negative to deduct):"); if (p) handleAdminAdjust(u.id, parseInt(p)); }} style={{ flex:1, padding:"8px 0", background:"rgba(255,122,26,0.08)", color:"var(--primary)", border:"1px solid rgba(255,122,26,0.2)", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Icon.Coin /> Adjust Points
                    </button>
                    <button onClick={() => { setAdminTab("notify"); setNotifTarget(u.id); }} style={{ flex:1, padding:"8px 0", background:"rgba(99,102,241,0.08)", color:"#6366F1", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                      <Icon.Send /> Notify
                    </button>
                    {u.email !== ADMIN_EMAIL && (
                      <button onClick={() => handleAdminDelete(u.id)} style={{ padding:"8px 12px", background:"rgba(239,68,68,0.08)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, fontWeight:600, fontSize:12, cursor:"pointer" }}>
                        <Icon.Trash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {adminData.users.length === 0 && <div style={{ textAlign:"center", padding:32, color:"var(--text-muted)" }}>No users yet</div>}
            </div>
          )}

          {/* Transactions */}
          {adminTab === "transactions" && !adminLoading && adminData && (
            <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 60px", padding:"10px 14px", background:"var(--bg-secondary)", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase" }}>
                <div>User / Description</div><div style={{ textAlign:"center" }}>Points</div><div style={{ textAlign:"center" }}>Status</div><div style={{ textAlign:"right" }}>Date</div>
              </div>
              {adminData.transactions.map(tx => (
                <div key={tx.id} style={{ display:"grid", gridTemplateColumns:"1fr 70px 70px 60px", padding:"10px 14px", borderBottom:"1px solid var(--border)", fontSize:12, alignItems:"center" }}>
                  <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{tx.description || tx.type}</div>
                  <div style={{ textAlign:"center", fontWeight:700, color: tx.points > 0 ? "var(--success)" : "var(--danger)" }}>{tx.points > 0 ? "+" : ""}{tx.points}</div>
                  <div style={{ textAlign:"center" }}>
                    <span style={{ padding:"2px 6px", borderRadius:50, fontSize:10, fontWeight:700, background: tx.status==="COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: tx.status==="COMPLETED" ? "#10B981" : "#F59E0B" }}>{tx.status}</span>
                  </div>
                  <div style={{ textAlign:"right", color:"var(--text-muted)", fontSize:11 }}>{timeAgo(tx.createdAt)}</div>
                </div>
              ))}
              {adminData.transactions.length === 0 && <div style={{ padding:32, textAlign:"center", color:"var(--text-muted)" }}>No transactions yet</div>}
            </div>
          )}

          {/* Notifications */}
          {adminTab === "notify" && (
            <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius-sm)", padding:20, border:"1px solid var(--border)" }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Send Notification</h3>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Target</label>
                <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)} style={{ ...inputStyle, marginBottom:0 }}>
                  <option value="all">All Users</option>
                  {adminData?.users.map(u => <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Title</label>
                <input placeholder="Notification title" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} style={{ ...inputStyle, marginBottom:0 }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Message</label>
                <textarea placeholder="Notification message..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} style={{ ...inputStyle, marginBottom:0, resize:"vertical" as const }} />
              </div>
              <button onClick={handleAdminNotify} style={{ width:"100%", padding:14, background:"var(--primary)", color:"white", border:"none", borderRadius:"var(--radius-xs)", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icon.Send /> Send Notification
              </button>
            </div>
          )}
        </div>
      )}

      {/* SURVEY WALL MODAL */}
      {showSurveyWall && wallUrl && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", display:"flex", flexDirection:"column" }} className="animate-fade-in">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--bg-primary)", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"var(--primary)" }}><Icon.Survey /></span>
              <span style={{ fontWeight:700, fontSize:15 }}>Survey Wall</span>
            </div>
            <button onClick={() => { setShowSurveyWall(false); loadUser(); loadTransactions(); }} style={{ background:"var(--danger)", color:"white", border:"none", padding:"6px 16px", borderRadius:50, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              <Icon.X /> Close
            </button>
          </div>
          <iframe src={wallUrl} style={{ flex:1, width:"100%", border:"none", background:"white" }} title="Survey Wall" allow="accelerometer; camera; microphone" />
        </div>
      )}

      {showSurveyWall && !wallUrl && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"var(--bg-card)", borderRadius:"var(--radius)", padding:32, textAlign:"center", margin:24 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Survey provider not configured</div>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>Add RAPIDOREACH_APP_ID and RAPIDOREACH_APP_KEY to your environment variables.</div>
            <button onClick={() => setShowSurveyWall(false)} style={{ padding:"10px 24px", background:"var(--primary)", color:"white", border:"none", borderRadius:50, fontWeight:700, cursor:"pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdraw && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }} className="animate-fade-in" onClick={() => setShowWithdraw(false)}>
          <div style={{ width:"100%", maxWidth:480, background:"var(--bg-card)", borderRadius:"20px 20px 0 0", padding:24 }} className="animate-slide-up" onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, background:"var(--border)", borderRadius:50, margin:"0 auto 16px" }} />
            <h3 style={{ fontWeight:700, fontSize:18, marginBottom:4 }}>Withdraw Funds</h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>Minimum withdrawal: 5,000 points ($5.00)</p>
            <div style={{ background:"var(--bg-secondary)", borderRadius:"var(--radius-xs)", padding:16, marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>Your Balance</div>
              <div style={{ fontSize:28, fontWeight:900, color:"var(--primary)", marginTop:4 }}>{formatNumber(user.pointsBalance)} pts</div>
              <div style={{ fontSize:14, color:"var(--text-secondary)" }}>${cashBalance}</div>
            </div>
            {user.pointsBalance < 5000 ? (
              <div style={{ textAlign:"center", padding:16, color:"var(--text-muted)", fontSize:13 }}>
                You need at least 5,000 points to withdraw.<br />Earn {5000 - user.pointsBalance} more points.
              </div>
            ) : (
              <button onClick={() => { showToast("Withdrawal request submitted. Processing in 24-48 hours.", "success"); setShowWithdraw(false); }} style={{ width:"100%", padding:16, background:"var(--primary)", color:"white", border:"none", borderRadius:"var(--radius-xs)", fontWeight:700, fontSize:16, cursor:"pointer" }}>
                Withdraw ${cashBalance}
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"var(--navy)", borderRadius:"20px 20px 0 0", display:"flex", justifyContent:"space-around", alignItems:"center", padding:`8px 0 max(8px, env(safe-area-inset-bottom))`, zIndex:100, maxWidth:480, margin:"0 auto", boxShadow:"0 -4px 24px rgba(0,0,0,0.15)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); window.scrollTo({ top:0, behavior:"smooth" }); }} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"6px 10px", borderRadius:12, opacity: activeTab===tab.id ? 1 : 0.45, transition:"all 0.2s", color: activeTab===tab.id ? "var(--primary)" : "rgba(255,255,255,0.7)" }}>
            <span style={{ transform: activeTab===tab.id ? "scale(1.1)" : "scale(1)", transition:"all 0.2s" }}>{tab.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color: activeTab===tab.id ? "var(--primary)" : "rgba(255,255,255,0.5)" }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ width:4, height:4, borderRadius:"50%", background:"var(--primary)" }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid var(--border)",
  background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:14, fontWeight:500,
  marginBottom:12, outline:"none", fontFamily:"inherit", transition:"border-color 0.2s",
};
