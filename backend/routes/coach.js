/**
 * GET /api/coach
 * Returns 2-3 Gemini-generated (or rule-based) savings tips.
 */

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Rule-based fallback tips ───────────────────────────────────────────────
function buildFallbackTips(catSpent, subs) {
    const tips = [];
    const total = Object.values(catSpent).reduce((a, b) => a + b, 0);

    // Food tip if food > 30% of total
    if (catSpent.Food > total * 0.3) {
        tips.push({
            title: 'Reduce dining-out orders',
            action: 'Cut Swiggy/Zomato from 6/month to 4/month',
            savings: '₹1,200/month',
            category: 'Food',
        });
    }

    // Unused subscription tip
    const unusedSub = subs.find(s => s.status === 'unused');
    if (unusedSub) {
        tips.push({
            title: 'Cancel unused subscription',
            action: `${unusedSub.merchant} not used recently`,
            savings: `₹${unusedSub.amount}/month`,
            category: 'Subscriptions',
        });
    }

    // Always suggest auto-save
    tips.push({
        title: 'Auto-save strategy',
        action: 'Move a fixed amount to savings right after salary',
        savings: 'Build emergency fund',
        category: 'Savings',
    });

    return tips.slice(0, 3);
}

router.get('/', async (req, res) => {
    try {
        const { user_id = 'default_user', month = currentMonth() } = req.query;

        const [txns, subs, budgetDoc] = await Promise.all([
            Transaction.find({ user_id, month }),
            Subscription.find({ user_id, is_active: true }),
            Budget.findOne({ user_id, month }),
        ]);

        // Build spending summary
        const catSpent = {};
        for (const cat of CATEGORIES) catSpent[cat] = 0;
        for (const t of txns) {
            const key = CATEGORIES.includes(t.category) ? t.category : 'Other';
            catSpent[key] += t.amount;
        }

        const total_spent = Object.values(catSpent).reduce((a, b) => a + b, 0);
        const sub_total = subs.reduce((s, x) => s + x.amount, 0);

        let tips;

        const key = process.env.GEMINI_API_KEY;
        if (key && key !== 'YOUR_GEMINI_API_KEY') {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const unusedSubs = subs
                .filter(s => s.status === 'unused')
                .map(s => `${s.merchant} ₹${s.amount}/month (unused)`)
                .join(', ');

            const catLines = Object.entries(catSpent)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `- ${k}: ₹${v}`)
                .join('\n');

            const prompt = `You are a friendly Indian money coach. Based on the spending summary below, give exactly 3 short, specific, actionable saving tips relevant to Indian spending habits.

Return ONLY a valid JSON array with objects having these exact keys: title, action, savings, category.
No markdown. No extra text. Just the JSON array.

Spending Summary (${month}):
Total spent: ₹${total_spent}
${catLines}
- Active subscriptions: ₹${sub_total}/month total${unusedSubs ? `\n- Possibly unused: ${unusedSubs}` : ''}`;

            try {
                const result = await model.generateContent(prompt);
                const raw = result.response.text().trim();
                const match = raw.match(/\[[\s\S]*?\]/);
                if (!match) throw new Error('No JSON array in Gemini response');
                tips = JSON.parse(match[0]).slice(0, 3);
            } catch (aiErr) {
                console.warn('Gemini coach failed, using rule-based tips:', aiErr.message);
                tips = buildFallbackTips(catSpent, subs);
            }
        } else {
            tips = buildFallbackTips(catSpent, subs);
        }

        // Sum up numeric savings from the tips
        const total_potential_savings = tips.reduce((sum, t) => {
            const m = (t.savings || '').match(/[\d,]+/);
            return sum + (m ? parseInt(m[0].replace(/,/g, '')) : 0);
        }, 0);

        res.json({
            tips,
            total_potential_savings,
            message: `If you follow these ${tips.length} tips, you could save ~₹${total_potential_savings.toLocaleString('en-IN')}/month!`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
