/**
 * PUT /api/budgets  – upsert budget for a month
 * GET /api/budgets?month=YYYY-MM – retrieve budget
 */

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

// ── GET ───────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { month, user_id = 'default_user' } = req.query;
        if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

        const doc = await Budget.findOne({ user_id, month });
        const budgets = doc?.budgets ?? {};
        const total_budget = CATEGORIES.reduce((sum, cat) => sum + (budgets[cat] || 0), 0);

        res.json({ month, budgets, total_budget });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT ───────────────────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
    try {
        const { month, budgets, user_id = 'default_user' } = req.body;
        if (!month || !budgets) {
            return res.status(400).json({ error: 'month and budgets fields are required' });
        }

        const doc = await Budget.findOneAndUpdate(
            { user_id, month },
            { user_id, month, budgets, updated_at: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const saved = doc.budgets?.toObject?.() ?? doc.budgets ?? {};
        const total_budget = CATEGORIES.reduce((sum, cat) => sum + (saved[cat] || 0), 0);

        res.json({ success: true, month, budgets: saved, total_budget });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
