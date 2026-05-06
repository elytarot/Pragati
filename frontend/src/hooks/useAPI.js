// src/hooks/useAPI.js — Custom hooks for every API module
import { useState, useEffect, useCallback } from "react";
import {
  childrenAPI, iepAPI, assessmentsAPI, interventionsAPI,
  devicesAPI, reportsAPI, aiAPI, dashboardAPI, adminAPI,
  locationsAPI, notificationsAPI,
} from "../api/index.js";

// ── GENERIC HOOK: useAsync ──────────────────────────────────────────
// Usage: const { data, loading, error, execute } = useAsync(fn, autoRun)
export const useAsync = (asyncFn, autoRun = false, deps = []) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(autoRun);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "An error occurred";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { if (autoRun) execute(); }, [autoRun]);

  return { data, loading, error, execute, setData };
};

// ── DASHBOARD ───────────────────────────────────────────────────────
export const useDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try   { const d = await dashboardAPI.get(); setData(d); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  return { data, loading, error, refresh: load };
};

// ── CHILDREN ────────────────────────────────────────────────────────
export const useChildren = (params = {}) => {
  const [children, setChildren] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async (p = params) => {
    setLoading(true); setError(null);
    try {
      const data = await childrenAPI.list(p);
      setChildren(data.data || []);
      setTotal(data.total || 0);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [JSON.stringify(params)]);

  const create = useCallback(async (data) => {
    const child = await childrenAPI.create(data);
    await load();
    return child;
  }, [load]);

  const update = useCallback(async (id, data) => {
    const updated = await childrenAPI.update(id, data);
    setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return { children, total, loading, error, refresh: load, create, update };
};

export const useChild = (id) => {
  const [child,   setChild]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try   { setChild(await childrenAPI.get(id)); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [id]);
  return { child, loading, error, refresh: load, setChild };
};

// ── IEP ─────────────────────────────────────────────────────────────
export const useIEP = (childId) => {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try   { setPlans(await iepAPI.list(childId)); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  }, [childId]);

  useEffect(() => { load(); }, [childId]);

  const createPlan = useCallback(async (data) => {
    const plan = await iepAPI.create(data);
    setPlans((prev) => [plan, ...prev]);
    return plan;
  }, []);

  const updatePlan = useCallback(async (id, data) => {
    const updated = await iepAPI.update(id, data);
    setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const addGoal = useCallback(async (iepId, data) => {
    const goal = await iepAPI.addGoal(iepId, data);
    setPlans((prev) => prev.map((p) => p.id === iepId
      ? { ...p, goals: [...(p.goals || []), goal] } : p));
    return goal;
  }, []);

  const updateProgress = useCallback(async (iepId, goalId, pct, note, status) => {
    const updated = await iepAPI.updateProgress(goalId, pct, note, status);
    setPlans((prev) => prev.map((p) => p.id === iepId
      ? { ...p, goals: p.goals.map((g) => (g.id === goalId ? updated : g)) } : p));
    return updated;
  }, []);

  return { plans, loading, error, refresh: load, createPlan, updatePlan, addGoal, updateProgress };
};

// ── ASSESSMENTS ─────────────────────────────────────────────────────
export const useAssessments = (childId) => {
  const [assessments, setAssessments] = useState([]);
  const [gap,         setGap]         = useState(null);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [list, gapData] = await Promise.all([
        assessmentsAPI.list({ childId }),
        assessmentsAPI.gap(childId),
      ]);
      setAssessments(list);
      setGap(gapData);
    } catch {}
    finally { setLoading(false); }
  }, [childId]);

  useEffect(() => { load(); }, [childId]);

  const create = useCallback(async (data) => {
    const a = await assessmentsAPI.create(data);
    setAssessments((prev) => [a, ...prev]);
    return a;
  }, []);

  return { assessments, gap, loading, refresh: load, create };
};

// ── INTERVENTIONS ────────────────────────────────────────────────────
export const useInterventions = (params = {}) => {
  const [interventions, setInterventions] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);

  const load = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const data = await interventionsAPI.list(p);
      setInterventions(data.data || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [JSON.stringify(params)]);

  const create = useCallback(async (data) => {
    const i = await interventionsAPI.create(data);
    setInterventions((prev) => [i, ...prev]);
    setTotal((t) => t + 1);
    return i;
  }, []);

  return { interventions, total, loading, refresh: load, create };
};

// ── DEVICES ──────────────────────────────────────────────────────────
export const useDevices = (params = {}) => {
  const [devices,  setDevices]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const data = await devicesAPI.list(p);
      setDevices(data.data || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [JSON.stringify(params)]);

  const create = useCallback(async (data) => {
    const d = await devicesAPI.create(data);
    setDevices((prev) => [d, ...prev]);
    setTotal((t) => t + 1);
    return d;
  }, []);

  return { devices, total, loading, refresh: load, create };
};

// ── LOCATIONS ─────────────────────────────────────────────────────────
export const useLocations = () => {
  const [districts, setDistricts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try   { setDistricts(await locationsAPI.tree()); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getBlocks = useCallback((districtId) => {
    const dist = districts.find((d) => d.id === districtId);
    return dist?.children || [];
  }, [districts]);

  return { districts, loading, getBlocks, refresh: load };
};

// ── AI GOALS ─────────────────────────────────────────────────────────
export const useAIGoals = () => {
  const [result,  setResult]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const generate = useCallback(async (params) => {
    setLoading(true); setError(""); setResult("");
    try {
      const data = await aiAPI.generateGoals(params);
      setResult(data.text);
      return data.text;
    } catch (err) {
      const msg = err.response?.data?.message || "AI generation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, generate, setResult };
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsAPI.list({ limit: 20 });
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000); // refresh every 60s
    return () => clearInterval(timer);
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, refresh: load, markRead, markAllRead };
};

// ── ADMIN ─────────────────────────────────────────────────────────────
export const useUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try   { setUsers(await adminAPI.listUsers()); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const create = useCallback(async (data) => {
    const u = await adminAPI.createUser(data);
    await load();
    return u;
  }, [load]);

  const update = useCallback(async (id, data) => {
    const u = await adminAPI.updateUser(id, data);
    await load();
    return u;
  }, [load]);

  return { users, loading, refresh: load, create, update };
};
