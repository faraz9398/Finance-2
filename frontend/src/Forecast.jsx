import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

export default function Forecast() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API}/api/forecast`);
                setData(res.data);
            } catch (e) {
                setError(e.response?.data?.error || 'Failed to load forecast');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const radarData = data
        ? Object.entries(data.by_category || {})
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value }))
        : [];

    const confidenceColor = {
        high: '#10b981',
        medium: '#f59e0b',
        low: '#ef4444',
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold">Next Month Forecast</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Predicted spending based on your 3-month average</p>
            </div>

            {error && <div className="glass p-4 text-sm" style={{ color: 'var(--danger)' }}>❌ {error}</div>}

            {loading ? (
                <div className="glass p-10 text-center animate-pulse" style={{ color: 'var(--muted)' }}>Calculating forecast…</div>
            ) : data ? (
                <>
                    {/* Hero card */}
                    <div className="glass p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)' }}>
                        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Predicted total for {data.month}</p>
                        <p className="text-5xl font-extrabold gradient-text">₹{data.predicted_total?.toLocaleString('en-IN')}</p>
                        <div className="mt-3 flex justify-center gap-2">
                            <span className="text-xs px-3 py-1 rounded-full font-semibold"
                                style={{ background: `${confidenceColor[data.confidence]}22`, color: confidenceColor[data.confidence] }}>
                                Confidence: {data.confidence}
                            </span>
                        </div>
                        <p className="mt-4 text-sm max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>{data.message}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar chart */}
                        {radarData.length > 0 && (
                            <div className="glass p-5">
                                <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>SPENDING PROFILE</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                                        <Radar name="Predicted" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                                        <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`}
                                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Category table */}
                        <div className="glass p-5">
                            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>BY CATEGORY</h2>
                            <div className="space-y-3">
                                {Object.entries(data.by_category || {}).filter(([, v]) => v > 0).map(([cat, amt]) => (
                                    <div key={cat} className="flex justify-between items-center py-1.5 border-b"
                                        style={{ borderColor: 'var(--border)' }}>
                                        <span className="text-sm font-medium">{cat}</span>
                                        <span className="font-bold">₹{amt.toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-sm font-semibold">Total</span>
                                    <span className="font-bold gradient-text">₹{data.predicted_total?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
