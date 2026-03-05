import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORY_ICONS = {
    Food: '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '📄',
    Entertainment: '🎬', Subscriptions: '🔄', Savings: '💰', Other: '📦',
};

function TipCard({ tip, index }) {
    return (
        <div className="glass p-5 fade-in-up" style={{ animationDelay: `${index * 120}ms` }}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl pulse-glow"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    {CATEGORY_ICONS[tip.category] || '💡'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                            #{index + 1}
                        </span>
                        <h3 className="font-semibold truncate">{tip.title}</h3>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{tip.action}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                        💰 Save: {tip.savings}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Coach() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetched, setFetched] = useState(false);

    async function fetchTips() {
        setLoading(true); setError('');
        try {
            const res = await axios.get(`${API}/api/coach`);
            setData(res.data);
            setFetched(true);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to get tips');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">AI Money Coach</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Personalised saving tips based on your spending</p>
            </div>

            {/* Hero CTA */}
            {!fetched && (
                <div className="glass p-10 text-center space-y-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 100%)' }}>
                    <p className="text-5xl">🤖</p>
                    <h2 className="text-xl font-bold">Ready for your personalised tips?</h2>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Our AI analyses your spending patterns and gives you 2–3 specific, actionable suggestions.
                    </p>
                    <button className="btn-primary mx-auto" onClick={fetchTips} disabled={loading}>
                        {loading ? <><span className="animate-spin">⏳</span> Analysing…</> : '✨ Get My Tips'}
                    </button>
                </div>
            )}

            {error && (
                <div className="glass p-4 text-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>❌ {error}</div>
            )}

            {fetched && data && (
                <>
                    {/* Tip cards */}
                    <div className="space-y-4">
                        {data.tips?.map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
                    </div>

                    {/* Summary */}
                    {data.total_potential_savings > 0 && (
                        <div className="glass p-6 text-center fade-in-up">
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>Total potential monthly savings</p>
                            <p className="text-4xl font-extrabold gradient-text mt-1">₹{data.total_potential_savings?.toLocaleString('en-IN')}</p>
                            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{data.message}</p>
                        </div>
                    )}

                    {/* Refresh */}
                    <button className="btn-ghost mx-auto block" onClick={fetchTips} disabled={loading}>
                        {loading ? '⏳ Refreshing…' : '🔄 Refresh Tips'}
                    </button>
                </>
            )}
        </div>
    );
}
