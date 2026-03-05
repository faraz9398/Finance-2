/**
 * GET /api/forecast
 * Predicts next month totals based on last 3 months average.
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

function getLastNMonths(n) {
    const months = [];
    const now = new Date();
    for (let i = 1; i <= n; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
}

function nextMonth() {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/', async (req, res) => {
    try {
        const { user_id = 'default_user' } = req.query;
        const months = getLastNMonths(3);

        const txnsByMonth = await Promise.all(
            months.map(m => Transaction.find({ user_id, month: m }))
        );

        // Average per category across up to 3 months of data
        const catSums = {};
        const catCounts = {};
        for (const cat of CATEGORIES) { catSums[cat] = 0; catCounts[cat] = 0; }

        for (const txns of txnsByMonth) {
            if (txns.length === 0) continue;
            const monthTotal = {};
            for (const cat of CATEGORIES) monthTotal[cat] = 0;
            for (const t of txns) {
                const key = CATEGORIES.includes(t.category) ? t.category : 'Other';
                monthTotal[key] += t.amount;
            }
            for (const cat of CATEGORIES) {
                catSums[cat] += monthTotal[cat];
                catCounts[cat] += 1;
            }
        }

        const by_category = {};
        for (const cat of CATEGORIES) {
            by_category[cat] = catCounts[cat] > 0 ? Math.round(catSums[cat] / catCounts[cat]) : 0;
        }

        const predicted_total = Object.values(by_category).reduce((a, b) => a + b, 0);
        const month = nextMonth();

        res.json({
            month,
            predicted_total,
            confidence: txnsByMonth.filter(t => t.length > 0).length >= 2 ? 'medium' : 'low',
            by_category,
            message: `Based on last ${months.length} months, next month ~₹${predicted_total.toLocaleString('en-IN')}. Bills are fixed; Food and Shopping vary.`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
