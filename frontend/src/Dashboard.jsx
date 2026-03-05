import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORY_COLORS = {
    Food: '#f59e0b',
    Transport: '#3b82f6',
    Shopping: '#ec4899',
    Bills: '#ef4444',
    Entertainment: '#8b5cf6',
    Subscriptions: '#10b981',
    Other: '#64748b',
};

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ProgressBar({ pct, color }) {
    const clampedPct = Math.min(pct, 100);
    const bg = pct > 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : color || '#6366f1';
    return (
        <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${clampedPct}%`, background: bg }} />
        </div>
    );
}

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="glass p-5 fade-in-up">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: accent || '#fff' }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</p>}
        </div>
    );
}

export default function Dashboard() {
    const [month, setMonth] = useState(currentMonth());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API}/api/dashboard?month=${month}`);
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const pieData = data?.categories?.map(c => ({ name: c.name, value: c.spent })).filter(d => d.value > 0) || [];
    const alerts = data?.categories?.filter(c => c.alert) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Your spending at a glance</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
            </div>

            {error && (
                <div className="glass p-4 text-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    ❌ {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass p-5 h-24 animate-pulse" style={{ background: 'var(--bg-card)' }} />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Spent" value={`₹${data.total_spent?.toLocaleString('en-IN')}`} accent="var(--primary-h)" />
                        <StatCard label="Total Budget" value={`₹${data.total_budget?.toLocaleString('en-IN')}`} />
                        <StatCard label="Remaining" value={`₹${Math.abs(data.remaining)?.toLocaleString('en-IN')}`}
                            accent={data.remaining < 0 ? 'var(--danger)' : 'var(--success)'}
                            sub={data.remaining < 0 ? 'Over budget!' : 'left to spend'} />
                        <StatCard label="Budget Used" value={`${data.percentage_spent}%`}
                            accent={data.percentage_spent > 100 ? 'var(--danger)' : data.percentage_spent >= 80 ? 'var(--warning)' : 'var(--success)'} />
                    </div>

                    {/* ── Overall progress ── */}
                    <div className="glass p-5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Overall budget usage</span>
                            <span style={{ color: 'var(--muted)' }}>₹{data.total_spent?.toLocaleString('en-IN')} / ₹{data.total_budget?.toLocaleString('en-IN')}</span>
                        </div>
                        <ProgressBar pct={data.percentage_spent} color="var(--primary)" />
                    </div>

                    {/* ── Charts + Categories ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie chart */}
                        {pieData.length > 0 && (
                            <div className="glass p-5">
                                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>SPENDING BY CATEGORY</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                            paddingAngle={3} dataKey="value">
                                            {pieData.map((entry) => (
                                                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Legend iconType="circle" formatter={(v) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Bar chart */}
                        {data.categories?.length > 0 && (
                            <div className="glass p-5">
                                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>SPENT vs BUDGET</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.categories} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                                        <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Bar dataKey="spent" name="Spent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="budget" name="Budget" fill="#2d2d4e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* ── Category details ── */}
                    {data.categories?.length > 0 && (
                        <div className="glass p-5">
                            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>CATEGORY BREAKDOWN</h2>
                            <div className="space-y-4">
                                {data.categories.map(cat => (
                                    <div key={cat.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full inline-block"
                                                    style={{ background: CATEGORY_COLORS[cat.name] || '#6366f1' }} />
                                                {cat.name}
                                            </span>
                                            <span style={{ color: 'var(--muted)' }}>
                                                ₹{cat.spent.toLocaleString('en-IN')} / ₹{cat.budget.toLocaleString('en-IN')}
                                                <span className="ml-2 font-bold" style={{ color: cat.percentage > 100 ? 'var(--danger)' : cat.percentage >= 80 ? 'var(--warning)' : 'var(--success)' }}>
                                                    {cat.percentage}%
                                                </span>
                                            </span>
                                        </div>
                                        <ProgressBar pct={cat.percentage} color={CATEGORY_COLORS[cat.name]} />
                                        {cat.alert && (
                                            <p className="text-xs mt-1" style={{ color: cat.percentage > 100 ? 'var(--danger)' : 'var(--warning)' }}>
                                                ⚠️ {cat.alert}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Alerts ── */}
                    {alerts.length > 0 && (
                        <div className="glass p-5" style={{ borderColor: 'var(--warning)' }}>
                            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--warning)' }}>⚠️ BUDGET ALERTS</h2>
                            <ul className="space-y-2">
                                {alerts.map(a => (
                                    <li key={a.name} className="text-sm flex gap-2">
                                        <span className="font-medium">{a.name}:</span>
                                        <span style={{ color: a.percentage > 100 ? 'var(--danger)' : 'var(--warning)' }}>{a.alert}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {data.categories?.length === 0 && !error && (
                        <div className="glass p-10 text-center">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="font-semibold">No transactions for {month}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Go to Upload and add your transactions.</p>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
