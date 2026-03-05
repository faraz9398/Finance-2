import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

const EXAMPLE_CSV = `Date,Amount,Description
2026-01-15,450,Starbucks coffee
2026-01-15,1500,Uber to office
2026-01-16,5000,Amazon purchase
2026-01-17,2500,Restaurant dinner
2026-01-18,1200,Movie tickets
2026-01-20,499,Netflix subscription
2026-01-22,2000,Electricity bill
2026-01-24,119,Spotify`;

export default function Upload() {
    const [csvText, setCsvText] = useState('');
    const [status, setStatus] = useState(null);   // null | 'loading' | 'done' | 'error'
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileRef = useRef();

    function loadExample() { setCsvText(EXAMPLE_CSV); setStatus(null); setResult(null); }

    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setCsvText(ev.target.result); setStatus(null); setResult(null); };
        reader.readAsText(file);
    }

    async function handleUpload() {
        setError('');
        if (!csvText.trim()) { setError('Please paste or load transactions first.'); return; }

        setStatus('loading');
        try {
            const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });
            if (parsed.errors.length && parsed.data.length === 0) {
                throw new Error('CSV parse error: ' + parsed.errors[0].message);
            }

            const transactions = parsed.data.map(row => {
                // Support different CSV header capitalisation
                const date = row.Date || row.date || row.DATE || '';
                const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || 0);
                const desc = row.Description || row.description || row.DESCRIPTION || row.desc || '';
                if (!date || !desc) return null;
                return { date, amount, description: desc };
            }).filter(Boolean);

            if (transactions.length === 0) {
                throw new Error('No valid rows found. Expected columns: Date, Amount, Description');
            }

            const res = await axios.post(`${API}/api/transactions/upload`, { transactions });
            setResult(res.data);
            setStatus('done');
        } catch (e) {
            setError(e.response?.data?.error || e.message || 'Upload failed');
            setStatus('error');
        }
    }

    const isLoading = status === 'loading';

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold">Import Transactions</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Paste CSV data or upload a file. Columns: <code className="px-1 rounded" style={{ background: 'var(--bg-card)' }}>Date, Amount, Description</code></p>
            </div>

            <div className="glass p-6 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-3">
                    <button className="btn-ghost" onClick={loadExample}>📋 Load Example</button>
                    <button className="btn-ghost" onClick={() => fileRef.current.click()}>📁 Upload CSV file</button>
                    <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
                </div>

                {/* Textarea */}
                <textarea
                    rows={12}
                    className="w-full rounded-xl p-4 text-sm font-mono resize-y border focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    placeholder={`Paste CSV here…\n\nDate,Amount,Description\n2026-01-15,450,Starbucks coffee\n2026-01-15,1500,Uber to office`}
                    value={csvText}
                    onChange={e => { setCsvText(e.target.value); setStatus(null); setResult(null); }}
                />

                {/* Upload button */}
                <button className="btn-primary w-full justify-center" onClick={handleUpload} disabled={isLoading}>
                    {isLoading ? (
                        <><span className="animate-spin">⏳</span> Processing with AI…</>
                    ) : '🚀 Categorise & Upload'}
                </button>

                {error && (
                    <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {status === 'done' && result && (
                <div className="glass p-6 space-y-4 fade-in-up">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl pulse-glow">✅</span>
                        <div>
                            <p className="font-semibold">Upload successful!</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>{result.count} transactions saved for {result.month}</p>
                        </div>
                    </div>

                    {result.categorized?.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ color: 'var(--muted)' }}>
                                        <th className="py-2 pr-4 text-left font-medium">Date</th>
                                        <th className="py-2 pr-4 text-right font-medium">Amount</th>
                                        <th className="py-2 pr-4 text-left font-medium">Description</th>
                                        <th className="py-2 text-left font-medium">Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.categorized.map((t, i) => (
                                        <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                            <td className="py-2 pr-4">{t.date}</td>
                                            <td className="py-2 pr-4 text-right">₹{t.amount.toLocaleString('en-IN')}</td>
                                            <td className="py-2 pr-4" style={{ color: 'var(--muted)' }}>{t.description}</td>
                                            <td className="py-2">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                                    {t.category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
