import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

function StatusBadge({ status }) {
    const cfg = {
        active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: '✅', label: 'Active' },
        unused: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: '⚠️', label: 'Possibly Unused' },
        cancelled: { bg: 'rgba(100,116,139,0.15)', color: '#64748b', icon: '❌', label: 'Cancelled' },
    };
    const { bg, color, icon, label } = cfg[status] || cfg.active;
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: bg, color }}>{icon} {label}</span>
    );
}

export default function Subscriptions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load() {
        setLoading(true); setError('');
        try {
            const res = await axios.get(`${API}/api/subscriptions`);
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const unusedSavings = data?.subscriptions?.filter(s => s.status === 'unused').reduce((a, b) => a + b.amount, 0) || 0;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Subscriptions</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Recurring payments detected in your transactions</p>
            </div>

            {error && <div className="glass p-4 text-sm" style={{ color: 'var(--danger)' }}>❌ {error}</div>}

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass p-5 h-20 animate-pulse" />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-5">
                            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Monthly Total</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#818cf8' }}>₹{data.total_monthly?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="glass p-5">
                            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Potential Savings</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: unusedSavings > 0 ? '#f59e0b' : 'var(--success)' }}>
                                ₹{unusedSavings.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>if unused subscriptions cancelled</p>
                        </div>
                    </div>

                    {/* Subscription list */}
                    {data.subscriptions?.length === 0 ? (
                        <div className="glass p-10 text-center">
                            <p className="text-4xl mb-3">🎉</p>
                            <p className="font-semibold">No recurring payments detected yet</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Upload more months of transactions to detect subscriptions.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.subscriptions.map((sub, i) => (
                                <div key={i} className={`glass p-5 fade-in-up ${sub.status === 'unused' ? 'border-yellow-500/30' : ''}`}
                                    style={{ animationDelay: `${i * 60}ms` }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ background: 'var(--bg)' }}>
                                                🔄
                                            </div>
                                            <div>
                                                <p className="font-semibold">{sub.merchant}</p>
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                                    Last seen: {sub.last_used || 'Unknown'}
                                                    {sub.days_unused > 0 ? ` · ${sub.days_unused} days ago` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{sub.amount?.toLocaleString('en-IN')}<span className="text-xs font-normal ml-1" style={{ color: 'var(--muted)' }}>/mo</span></p>
                                            <StatusBadge status={sub.status} />
                                        </div>
                                    </div>
                                    {sub.warning && (
                                        <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                            💡 {sub.warning}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
