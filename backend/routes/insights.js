/**
 * GET /api/insights?month=YYYY-MM
 * Month-over-month spending comparison.
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

function prevMonth(month) {
    const [y, m] = month.split('-').map(Number);
    if (m === 1) return `${y - 1}-12`;
    return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function sumByCategory(txns) {
    const totals = {};
    for (const cat of CATEGORIES) totals[cat] = 0;
    for (const t of txns) {
        const key = CATEGORIES.includes(t.category) ? t.category : 'Other';
        totals[key] += t.amount;
    }
    return totals;
}

router.get('/', async (req, res) => {
    try {
        const { month, user_id = 'default_user' } = req.query;
        if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

        const lastMonth = prevMonth(month);

        const [thisTxns, lastTxns] = await Promise.all([
            Transaction.find({ user_id, month }),
            Transaction.find({ user_id, month: lastMonth }),
        ]);

        const thisCats = sumByCategory(thisTxns);
        const lastCats = sumByCategory(lastTxns);

        const this_month = Object.values(thisCats).reduce((a, b) => a + b, 0);
        const last_month = Object.values(lastCats).reduce((a, b) => a + b, 0);
        const change_amount = this_month - last_month;
        const change_percent = last_month > 0 ? Math.round((change_amount / last_month) * 100) : 0;

        // Top increases (only categories that went up)
        const increases = CATEGORIES
            .map(cat => ({
                category: cat,
                this_month: thisCats[cat],
                last_month: lastCats[cat],
                increase: thisCats[cat] - lastCats[cat],
                increase_percent: lastCats[cat] > 0
                    ? Math.round(((thisCats[cat] - lastCats[cat]) / lastCats[cat]) * 100)
                    : 0,
            }))
            .filter(d => d.increase > 0)
            .sort((a, b) => b.increase - a.increase)
            .slice(0, 3);

        const dir = change_percent >= 0 ? 'up' : 'down';
        const message = last_month > 0
            ? `Spending ${dir} ${Math.abs(change_percent)}% this month`
            : 'No data for previous month';

        res.json({
            this_month,
            last_month,
            change_percent,
            change_amount,
            message,
            top_increases: increases,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
