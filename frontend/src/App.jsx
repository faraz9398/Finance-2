import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

import Dashboard from './Dashboard.jsx';
import Upload from './Upload.jsx';
import Subscriptions from './Subscriptions.jsx';
import Insights from './Insights.jsx';
import Forecast from './Forecast.jsx';
import Coach from './Coach.jsx';
import Budgets from './Budgets.jsx';

const NAV = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/upload', label: 'Upload', icon: '📤' },
    { to: '/budgets', label: 'Budgets', icon: '🎯' },
    { to: '/subscriptions', label: 'Subscriptions', icon: '🔄' },
    { to: '/insights', label: 'Insights', icon: '📈' },
    { to: '/forecast', label: 'Forecast', icon: '🔮' },
    { to: '/coach', label: 'AI Coach', icon: '💡' },
];

export default function App() {
    return (
        <BrowserRouter>
            <div className="flex min-h-screen">
                {/* ── Sidebar ── */}
                <aside className="hidden md:flex flex-col w-60 fixed top-0 left-0 h-full border-r p-4 gap-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                    <div className="mb-6 px-2">
                        <h1 className="text-xl font-bold gradient-text">💰 Money Coach</h1>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>AI Expense Manager</p>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ to, label, icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            >
                                <span>{icon}</span>
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto text-xs px-2" style={{ color: 'var(--muted)' }}>
                        <p>💳 Track · Save · Grow</p>
                    </div>
                </aside>

                {/* ── Mobile bottom nav ── */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center py-2 border-t"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    {NAV.map(({ to, icon }) => (
                        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
                            `flex flex-col items-center text-xs p-1 rounded-lg transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500'}`
                        }>
                            <span className="text-lg">{icon}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* ── Main content ── */}
                <main className="flex-1 md:ml-60 p-4 md:p-8 pb-24 md:pb-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/subscriptions" element={<Subscriptions />} />
                        <Route path="/insights" element={<Insights />} />
                        <Route path="/forecast" element={<Forecast />} />
                        <Route path="/coach" element={<Coach />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
