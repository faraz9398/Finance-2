import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Budgets() {
    const [month, setMonth] = useState(currentMonth());
    const [budgets, setBudgets] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const fetchBudgets = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/api/budgets?month=${month}`);
            const b = res.data.budgets || {};
            const defaults = {};
            for (const cat of CATEGORIES) defaults[cat] = b[cat] ?? 0;
            setBudgets(defaults);
        } catch {
            const defaults = {};
            for (const cat of CATEGORIES) defaults[cat] = 0;
            setBudgets(defaults);
        }
    }, [month]);

    useEffect(() => { fetchBudgets(); setSaved(false); }, [fetchBudgets]);

    async function handleSave() {
        setSaving(true); setError(''); setSaved(false);
        try {
            await axios.put(`${API}/api/budgets`, { month, budgets });
            setSaved(true);
        } catch (e) {
            setError(e.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    const total = Object.values(budgets).reduce((a, b) => a + (Number(b) || 0), 0);

    const CATEGORY_ICONS = {
        Food: '🍔', Transport: '🚗', Shopping: '🛍️', Bills: '📄',
        Entertainment: '🎬', Subscriptions: '🔄', Other: '📦',
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Set Budgets</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Define monthly spending limits per category</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={e => { setMonth(e.target.value); setSaved(false); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
            </div>

            <div className="glass p-6 space-y-4">
                {CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center gap-4">
                        <span className="text-xl w-8 text-center">{CATEGORY_ICONS[cat]}</span>
                        <label className="flex-1 text-sm font-medium">{cat}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>₹</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={budgets[cat] ?? 0}
                                onChange={e => setBudgets(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                                className="pl-7 pr-4 py-2 rounded-xl border text-sm w-36 text-right focus:outline-none focus:border-indigo-500 transition-colors"
                                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                            />
                        </div>
                    </div>
                ))}

                <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-sm">
                        <span style={{ color: 'var(--muted)' }}>Total budget: </span>
                        <span className="font-bold gradient-text">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? '💾 Saving…' : '💾 Save Budgets'}
                    </button>
                </div>

                {saved && (
                    <div className="text-sm px-4 py-3 rounded-xl fade-in-up" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                        ✅ Budgets saved for {month}!
                    </div>
                )}
                {error && (
                    <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                        ❌ {error}
                    </div>
                )}
            </div>
        </div>
    );
}
