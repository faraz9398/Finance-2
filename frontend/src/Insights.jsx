import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ChangeChip({ pct }) {
    if (pct === 0) return null;
    const up = pct > 0;
    return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: up ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: up ? '#ef4444' : '#10b981' }}>
            {up ? '↑' : '↓'} {Math.abs(pct)}%
        </span>
    );
}

export default function Insights() {
    const [month, setMonth] = useState(currentMonth());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await axios.get(`${API}/api/insights?month=${month}`);
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { load(); }, [load]);

    const barData = data?.top_increases?.map(d => ({
        name: d.category,
        'This Month': d.this_month,
        'Last Month': d.last_month,
    })) || [];

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Spending Insights</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Month-over-month analysis</p>
                </div>
                <input
                    type="month" value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="px-4 py-2 rounded-xl text-sm border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
            </div>

            {error && <div className="glass p-4 text-sm" style={{ color: 'var(--danger)' }}>❌ {error}</div>}

            {loading ? (
                <div className="glass p-10 text-center animate-pulse" style={{ color: 'var(--muted)' }}>
                    Loading insights…
                </div>
            ) : data ? (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass p-5 col-span-2">
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>This Month Total</p>
                            <p className="text-3xl font-bold" style={{ color: '#818cf8' }}>₹{data.this_month?.toLocaleString('en-IN')}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{data.message}</p>
                        </div>
                        <div className="glass p-5">
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Last Month</p>
                            <p className="text-2xl font-bold">₹{data.last_month?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="glass p-5">
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Change</p>
                            <p className="text-2xl font-bold flex items-center gap-2">
                                <ChangeChip pct={data.change_percent} />
                                <span style={{ color: 'var(--muted)', fontSize: 13 }}>₹{Math.abs(data.change_amount || 0).toLocaleString('en-IN')}</span>
                            </p>
                        </div>
                    </div>

                    {/* Bar chart */}
                    {barData.length > 0 && (
                        <div className="glass p-5">
                            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>TOP CATEGORY INCREASES</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                                    <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Legend formatter={v => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>} />
                                    <Bar dataKey="This Month" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Last Month" fill="#2d2d4e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Top increases list */}
                    {data.top_increases?.length > 0 ? (
                        <div className="glass p-5">
                            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>BIGGEST INCREASES</h2>
                            <div className="space-y-4">
                                {data.top_increases.map((d, i) => (
                                    <div key={d.category} className="fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium flex items-center gap-2">
                                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>#{i + 1}</span>
                                                {d.category}
                                                <ChangeChip pct={d.increase_percent} />
                                            </span>
                                            <span className="text-sm" style={{ color: 'var(--muted)' }}>
                                                ₹{d.last_month.toLocaleString('en-IN')} → ₹{d.this_month.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{ width: `${Math.min(d.increase_percent, 100)}%`, background: '#ef4444' }} />
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>+₹{d.increase.toLocaleString('en-IN')} increase</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass p-8 text-center">
                            <p className="text-3xl mb-2">🎉</p>
                            <p className="font-semibold">No significant increases</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Your spending stayed the same or decreased this month!</p>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
