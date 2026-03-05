/**
 * GET  /api/dashboard?month=YYYY-MM
 * Returns totals, per-category spent vs budget, and alerts.
 */

const express = require('express');
const router = express.Router();

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function buildAlert(cat, spent, budget) {
    if (budget === 0) return null;
    const pct = Math.round((spent / budget) * 100);
    if (spent > budget) return `Over budget by ₹${(spent - budget).toLocaleString('en-IN')}`;
    if (pct >= 80) return `Budget at ${pct}%—be careful!`;
    return null;
}

router.get('/', async (req, res) => {
    try {
        const { month = currentMonth(), user_id = 'default_user' } = req.query;

        // Fetch transactions for this month
        const txns = await Transaction.find({ user_id, month });
        const budgetDoc = await Budget.findOne({ user_id, month });

        // Sum spending per category
        const spent = {};
        for (const cat of CATEGORIES) spent[cat] = 0;
        for (const t of txns) {
            if (CATEGORIES.includes(t.category)) spent[t.category] += t.amount;
            else spent['Other'] += t.amount;
        }

        const budgets = budgetDoc?.budgets?.toObject?.() ?? budgetDoc?.budgets ?? {};

        const total_spent = Object.values(spent).reduce((a, b) => a + b, 0);
        const total_budget = CATEGORIES.reduce((a, cat) => a + (budgets[cat] || 0), 0);

        const categories = CATEGORIES
            .filter(cat => spent[cat] > 0 || (budgets[cat] || 0) > 0)
            .map(cat => {
                const s = spent[cat] || 0;
                const b = budgets[cat] || 0;
                const percentage = b > 0 ? Math.round((s / b) * 100) : 0;
                return { name: cat, spent: s, budget: b, percentage, alert: buildAlert(cat, s, b) };
            });

        res.json({
            total_spent,
            total_budget,
            remaining: total_budget - total_spent,
            percentage_spent: total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0,
            categories,
            month,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
