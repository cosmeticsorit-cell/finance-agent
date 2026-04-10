import { useState, useEffect, useRef } from “react”;

const CATEGORIES = {
supermarket: { label: “סופר”, icon: “🛒”, color: “#4ade80” },
restaurant: { label: “מסעדות”, icon: “🍽️”, color: “#fb923c” },
transport: { label: “תחבורה”, icon: “🚗”, color: “#60a5fa” },
health: { label: “בריאות”, icon: “💊”, color: “#f472b6” },
utilities: { label: “חשבונות”, icon: “⚡”, color: “#facc15” },
entertainment: { label: “בידור”, icon: “🎬”, color: “#a78bfa” },
clothing: { label: “ביגוד”, icon: “👕”, color: “#34d399” },
other: { label: “אחר”, icon: “📦”, color: “#94a3b8” },
};
const PAYMENT_METHODS = {
credit: { label: “אשראי”, icon: “💳” },
cash: { label: “מזומן”, icon: “💵” },
bank: { label: “העברה”, icon: “🏦” },
};
const RECUR_FREQ = { monthly: “חודשי”, weekly: “שבועי”, yearly: “שנתי” };

const initialExpenses = [
{ id: 1, desc: “שופרסל”, amount: 287, category: “supermarket”, payment: “credit”, date: “2026-04-08”, items: [“לחם”, “חלב”] },
{ id: 2, desc: “קפה גרג”, amount: 32, category: “restaurant”, payment: “cash”, date: “2026-04-09”, items: [] },
{ id: 3, desc: “דלק”, amount: 210, category: “transport”, payment: “credit”, date: “2026-04-07”, items: [] },
{ id: 4, desc: “רמי לוי”, amount: 156, category: “supermarket”, payment: “cash”, date: “2026-04-06”, items: [“עוף”, “ירקות”] },
{ id: 5, desc: “חשמל”, amount: 340, category: “utilities”, payment: “bank”, date: “2026-04-05”, items: [] },
];
const initialRecurring = [
{ id: 101, desc: “שכירות”, amount: 4200, category: “utilities”, payment: “bank”, freq: “monthly”, dayOfMonth: 1, active: true },
{ id: 102, desc: “נטפליקס”, amount: 49, category: “entertainment”, payment: “credit”, freq: “monthly”, dayOfMonth: 5, active: true },
{ id: 103, desc: “ביטוח בריאות”, amount: 320, category: “health”, payment: “bank”, freq: “monthly”, dayOfMonth: 15, active: true },
];
const initialBankFees = [
{ id: 201, month: “2026-03”, desc: “דמי ניהול”, amount: 25, type: “fee” },
{ id: 202, month: “2026-03”, desc: “ריבית אוברדרפט”, amount: 67, type: “interest” },
{ id: 203, month: “2026-02”, desc: “דמי ניהול”, amount: 25, type: “fee” },
{ id: 204, month: “2026-02”, desc: “עמלת כרטיס”, amount: 15, type: “fee” },
];
// Home transfers: each entry has amount, date, tithePaid (bool)
const initialHomeTransfers = [
{ id: 301, amount: 1500, date: “2026-04-03”, note: “הוצאות בית”, tithePaid: true, titheAmount: 150 },
{ id: 302, amount: 800, date: “2026-04-10”, note: “קניות לבית”, tithePaid: false, titheAmount: 0 },
];
const initialGoals = [
{ id: 1, label: “חיסכון לחופשה”, target: 5000, current: 1200, color: “#60a5fa”, icon: “✈️” },
{ id: 2, label: “קרן חירום”, target: 10000, current: 3400, color: “#4ade80”, icon: “🛡️” },
];
const MONTHLY_BUDGET = 8000;
const CAT_BUDGETS = { supermarket: 800, restaurant: 300, transport: 400, entertainment: 200 };

// Simple SVG donut
function Donut({ segments, size = 120, stroke = 22 }) {
const r = (size - stroke) / 2;
const circ = 2 * Math.PI * r;
let offset = 0;
return (
<svg width={size} height={size} style={{ transform: “rotate(-90deg)” }}>
<circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
{segments.map((seg, i) => {
const len = (seg.pct / 100) * circ;
const el = (
<circle key={i} cx={size/2} cy={size/2} r={r} fill=“none”
stroke={seg.color} strokeWidth={stroke}
strokeDasharray={`${len} ${circ - len}`}
strokeDashoffset={-offset} strokeLinecap=“round” opacity={0.85} />
);
offset += len;
return el;
})}
</svg>
);
}

// Simple bar chart (SVG)
function BarChart({ data, height = 90 }) {
const max = Math.max(…data.map(d => d.value), 1);
const w = 100 / data.length;
return (
<svg width=“100%” height={height} style={{ overflow: “visible” }}>
{data.map((d, i) => {
const bh = (d.value / max) * (height - 20);
return (
<g key={i}>
<rect x={`${i * w + w * 0.15}%`} y={height - 20 - bh} width={`${w * 0.7}%`} height={bh}
fill={d.color || “#818cf8”} rx={4} opacity={0.85} />
<text x={`${i * w + w / 2}%`} y={height - 4} textAnchor=“middle”
fill=”#64748b” fontSize={9} fontFamily=“Heebo,sans-serif”>{d.label}</text>
<text x={`${i * w + w / 2}%`} y={height - 24 - bh} textAnchor=“middle”
fill=”#e2e8f0” fontSize={9} fontFamily=“Heebo,sans-serif”>₪{d.value}</text>
</g>
);
})}
</svg>
);
}

export default function FinanceAgent() {
const [expenses, setExpenses] = useState(initialExpenses);
const [recurring, setRecurring] = useState(initialRecurring);
const [bankFees, setBankFees] = useState(initialBankFees);
const [homeTransfers, setHomeTransfers] = useState(initialHomeTransfers);
const [goals, setGoals] = useState(initialGoals);
const [view, setView] = useState(“dashboard”);
const [aiInput, setAiInput] = useState(””);
const [aiMessages, setAiMessages] = useState([
{ role: “assistant”, text: “שלום! אני הסוכן הפיננסי שלך 🤖\nאני מותאם במיוחד לקוסמטיקאית — אני עוקב אחרי הכנסות, העברות לבית, מעשרות ויעדי חיסכון.\nשאלי אותי כל שאלה!” }
]);
const [loading, setLoading] = useState(false);
const [addForm, setAddForm] = useState({ desc: “”, amount: “”, category: “supermarket”, payment: “credit”, date: new Date().toISOString().split(“T”)[0], items: “” });
const [recurForm, setRecurForm] = useState({ desc: “”, amount: “”, category: “utilities”, payment: “bank”, freq: “monthly”, dayOfMonth: “1” });
const [feeForm, setFeeForm] = useState({ desc: “”, amount: “”, month: “2026-04”, type: “fee” });
const [transferForm, setTransferForm] = useState({ amount: “”, date: new Date().toISOString().split(“T”)[0], note: “” });
const [goalForm, setGoalForm] = useState({ label: “”, target: “”, icon: “🎯” });
const [receiptText, setReceiptText] = useState(””);
const [receiptLoading, setReceiptLoading] = useState(false);
const [addSubView, setAddSubView] = useState(“one-time”);
const [bankSubView, setBankSubView] = useState(“summary”);
const [selectedMonth, setSelectedMonth] = useState(“2026-03”);
const [titheModal, setTitheModal] = useState(null); // transfer id awaiting tithe answer
const [alertDismissed, setAlertDismissed] = useState({});
const chatEndRef = useRef(null);

useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: “smooth” }); }, [aiMessages]);

// ── Derived numbers ──
const recurringMonthlyTotal = recurring.filter(r => r.active && r.freq === “monthly”).reduce((s, r) => s + r.amount, 0);
const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
const totalSpent = expensesTotal + recurringMonthlyTotal;
const creditTotal = expenses.filter(e => e.payment === “credit”).reduce((s, e) => s + e.amount, 0) + recurring.filter(r => r.active && r.payment === “credit”).reduce((s, r) => s + r.amount, 0);
const cashTotal = expenses.filter(e => e.payment === “cash”).reduce((s, e) => s + e.amount, 0);
const bankTotal = expenses.filter(e => e.payment === “bank”).reduce((s, e) => s + e.amount, 0) + recurring.filter(r => r.active && r.payment === “bank”).reduce((s, r) => s + r.amount, 0);
const budgetPct = Math.min((totalSpent / MONTHLY_BUDGET) * 100, 100);

const categoryTotals = Object.keys(CATEGORIES).map(cat => {
const fromExp = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
const fromRec = recurring.filter(r => r.active && r.category === cat && r.freq === “monthly”).reduce((s, r) => s + r.amount, 0);
return { cat, total: fromExp + fromRec };
}).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

const totalHomeTransfers = homeTransfers.reduce((s, t) => s + t.amount, 0);
const unpaidTithes = homeTransfers.filter(t => !t.tithePaid);
const titheOwed = unpaidTithes.reduce((s, t) => s + t.amount * 0.1, 0);

const monthFees = bankFees.filter(f => f.month === selectedMonth);
const monthFeesTotal = monthFees.reduce((s, f) => s + f.amount, 0);
const feesByMonth = bankFees.reduce((acc, f) => { acc[f.month] = (acc[f.month] || 0) + f.amount; return acc; }, {});
const maxFee = Math.max(…Object.values(feesByMonth), 1);

// Alerts
const alerts = [];
if (budgetPct > 85) alerts.push({ id: “budget”, icon: “🚨”, text: `השתמשת ב-${budgetPct.toFixed(0)}% מהתקציב!`, color: “#f87171” });
Object.entries(CAT_BUDGETS).forEach(([cat, limit]) => {
const spent = categoryTotals.find(c => c.cat === cat)?.total || 0;
if (spent > limit * 0.85) alerts.push({ id: `cat_${cat}`, icon: “⚠️”, text: `${CATEGORIES[cat].label}: ₪${spent} מתוך תקציב ₪${limit}`, color: “#fb923c” });
});
if (unpaidTithes.length > 0) alerts.push({ id: “tithe”, icon: “🕊️”, text: `${unpaidTithes.length} העברות לבית ללא מעשרות — ₪${titheOwed.toFixed(0)} לתת`, color: “#a78bfa” });
const activeAlerts = alerts.filter(a => !alertDismissed[a.id]);

// ── Chart data ──
const donutSegments = categoryTotals.slice(0, 5).map(c => ({ pct: (c.total / totalSpent) * 100, color: CATEGORIES[c.cat].color }));
const barData = [
{ label: “סופר”, value: categoryTotals.find(c => c.cat === “supermarket”)?.total || 0, color: “#4ade80” },
{ label: “מסעדות”, value: categoryTotals.find(c => c.cat === “restaurant”)?.total || 0, color: “#fb923c” },
{ label: “תחבורה”, value: categoryTotals.find(c => c.cat === “transport”)?.total || 0, color: “#60a5fa” },
{ label: “בריאות”, value: categoryTotals.find(c => c.cat === “health”)?.total || 0, color: “#f472b6” },
{ label: “קבועות”, value: recurringMonthlyTotal, color: “#a78bfa” },
];

// ── AI ──
async function sendToAI(userMsg) {
setLoading(true);
const expSummary = expenses.map(e => `${e.date}: ${e.desc} ₪${e.amount}`).join(”\n”);
const recSummary = recurring.filter(r => r.active).map(r => `${r.desc} ₪${r.amount}/${RECUR_FREQ[r.freq]}`).join(”\n”);
const transferSummary = homeTransfers.map(t => `${t.date}: ₪${t.amount} (${t.tithePaid ? "מעשרות ✅" : "ללא מעשרות ❌"})`).join(”\n”);
const goalsSummary = goals.map(g => `${g.label}: ₪${g.current}/${g.target}`).join(”\n”);
try {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
system: `אתה סוכן פיננסי חכם בעברית. המשתמשת היא קוסמטיקאית עצמאית.

הוצאות: ${expSummary}
קבועות: ${recSummary}
העברות לבית: ${transferSummary}
סה”כ העברות: ₪${totalHomeTransfers} | מעשרות שחייבת: ₪${titheOwed.toFixed(0)}
יעדים: ${goalsSummary}
תקציב: ₪${totalSpent}/₪${MONTHLY_BUDGET}

כשמוזכרת העברה לבית חדשה — שאלי תמיד “האם נתת מעשרות על הסכום הזה?”.
ענה בעברית, קצר, ידידותי, מעשי.`,
messages: [{ role: “user”, content: userMsg }]
})
});
const data = await res.json();
setAiMessages(prev => […prev, { role: “assistant”, text: data.content?.[0]?.text || “שגיאה” }]);
} catch {
setAiMessages(prev => […prev, { role: “assistant”, text: “שגיאה בחיבור.” }]);
}
setLoading(false);
}

async function parseReceipt() {
if (!receiptText.trim()) return;
setReceiptLoading(true);
try {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 600,
system: `חלץ מחשבונית JSON בלבד: {"store":"","date":"YYYY-MM-DD","total":0,"category":"supermarket/restaurant/transport/health/utilities/entertainment/clothing/other","items":[]}`,
messages: [{ role: “user”, content: receiptText }]
})
});
const data = await res.json();
const parsed = JSON.parse((data.content?.[0]?.text || “{}”).replace(/`json|`/g, “”).trim());
if (parsed.total && parsed.store) {
setExpenses(prev => [{ id: Date.now(), desc: parsed.store, amount: parsed.total, category: parsed.category || “other”, payment: “credit”, date: parsed.date || new Date().toISOString().split(“T”)[0], items: parsed.items || [] }, …prev]);
setReceiptText(””);
setAiMessages(prev => […prev, { role: “assistant”, text: `✅ חשבונית מ-${parsed.store} נוספה! ₪${parsed.total}` }]);
setView(“chat”);
}
} catch { alert(“לא הצלחתי לנתח”); }
setReceiptLoading(false);
}

function addExpense() {
if (!addForm.desc || !addForm.amount) return;
setExpenses(prev => [{ id: Date.now(), desc: addForm.desc, amount: parseFloat(addForm.amount), category: addForm.category, payment: addForm.payment, date: addForm.date, items: addForm.items ? addForm.items.split(”,”).map(s => s.trim()) : [] }, …prev]);
setAddForm(p => ({ …p, desc: “”, amount: “”, items: “” }));
setView(“dashboard”);
}

function addHomeTransfer() {
if (!transferForm.amount) return;
const newT = { id: Date.now(), amount: parseFloat(transferForm.amount), date: transferForm.date, note: transferForm.note, tithePaid: false, titheAmount: 0 };
setHomeTransfers(prev => [newT, …prev]);
setTransferForm(p => ({ …p, amount: “”, note: “” }));
// ask about tithe
setTitheModal(newT.id);
}

function answerTithe(transferId, paid) {
setHomeTransfers(prev => prev.map(t => t.id === transferId
? { …t, tithePaid: paid, titheAmount: paid ? t.amount * 0.1 : 0 }
: t
));
setTitheModal(null);
if (!paid) {
setAiMessages(prev => […prev, { role: “assistant”, text: `🕊️ תזכורת: יש מעשרות של ₪${(homeTransfers.find(t => t.id === transferId)?.amount * 0.1 || 0).toFixed(0)} על ההעברה האחרונה. תוכלי להסדיר כשנוח לך 💙` }]);
setView(“chat”);
}
}

function handleAISend() {
if (!aiInput.trim() || loading) return;
setAiMessages(prev => […prev, { role: “user”, text: aiInput }]);
sendToAI(aiInput);
setAiInput(””);
}

// ── Styles ──
const S = {
app: { fontFamily: “‘Heebo’,‘Assistant’,sans-serif”, direction: “rtl”, background: “linear-gradient(135deg,#0a0a1f 0%,#12122e 60%,#0a0a1f 100%)”, minHeight: “100vh”, color: “#e2e8f0”, maxWidth: 480, margin: “0 auto”, position: “relative” },
header: { background: “rgba(255,255,255,0.03)”, backdropFilter: “blur(20px)”, borderBottom: “1px solid rgba(255,255,255,0.07)”, padding: “14px 16px 0”, position: “sticky”, top: 0, zIndex: 100 },
nav: { display: “flex”, gap: 1, marginTop: 10, overflowX: “auto”, paddingBottom: 0 },
nb: (a) => ({ flex: “0 0 auto”, padding: “9px 10px”, background: “none”, border: “none”, color: a ? “#a78bfa” : “#4a5568”, fontSize: 10.5, fontWeight: a ? 700 : 500, cursor: “pointer”, borderBottom: a ? “2px solid #a78bfa” : “2px solid transparent”, fontFamily: “inherit”, whiteSpace: “nowrap” }),
p: { padding: 14 },
card: { background: “rgba(255,255,255,0.045)”, borderRadius: 16, padding: 14, marginBottom: 12, border: “1px solid rgba(255,255,255,0.07)” },
inp: { width: “100%”, background: “rgba(255,255,255,0.07)”, border: “1px solid rgba(255,255,255,0.1)”, borderRadius: 10, padding: “10px 12px”, color: “#e2e8f0”, fontSize: 14, fontFamily: “inherit”, outline: “none”, boxSizing: “border-box”, direction: “rtl” },
sel: { width: “100%”, background: “#13132e”, border: “1px solid rgba(255,255,255,0.1)”, borderRadius: 10, padding: “10px 12px”, color: “#e2e8f0”, fontSize: 14, fontFamily: “inherit”, outline: “none”, boxSizing: “border-box” },
btn: (c = “linear-gradient(135deg,#818cf8,#a78bfa)”) => ({ width: “100%”, padding: 12, background: c, border: “none”, borderRadius: 12, color: “white”, fontSize: 14, fontWeight: 700, cursor: “pointer”, fontFamily: “inherit” }),
row: { display: “flex”, alignItems: “center”, gap: 10, padding: “10px 0”, borderBottom: “1px solid rgba(255,255,255,0.05)” },
sub: (a) => ({ flex: 1, padding: “8px 4px”, background: a ? “rgba(167,139,250,0.12)” : “rgba(255,255,255,0.03)”, border: a ? “1px solid #a78bfa44” : “1px solid rgba(255,255,255,0.07)”, borderRadius: 10, color: a ? “#a78bfa” : “#4a5568”, fontSize: 11, fontWeight: a ? 700 : 500, cursor: “pointer”, fontFamily: “inherit” }),
bubble: (u) => ({ maxWidth: “82%”, padding: “10px 14px”, borderRadius: u ? “18px 18px 4px 18px” : “18px 18px 18px 4px”, background: u ? “linear-gradient(135deg,#818cf8,#a78bfa)” : “rgba(255,255,255,0.07)”, marginBottom: 8, alignSelf: u ? “flex-start” : “flex-end”, fontSize: 13, lineHeight: 1.55, whiteSpace: “pre-wrap”, border: u ? “none” : “1px solid rgba(255,255,255,0.09)” }),
modal: { position: “fixed”, inset: 0, background: “rgba(0,0,0,0.75)”, zIndex: 200, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 24 },
modalBox: { background: “#1a1a3e”, borderRadius: 20, padding: 24, maxWidth: 340, width: “100%”, border: “1px solid rgba(167,139,250,0.3)”, textAlign: “center” },
};

const navItems = [
[“dashboard”,“📊 דשבורד”],[“charts”,“📈 גרפים”],[“goals”,“🎯 יעדים”],
[“home”,“🏠 בית”],[“recurring”,“🔁 קבועות”],[“bank”,“🏦 בנק”],
[“add”,“➕ הוסף”],[“receipt”,“🧾 חשבונית”],[“chat”,“🤖 סוכן”],
];

return (
<div style={S.app}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.25);border-radius:99px}textarea{resize:none}input[type=date]::-webkit-calendar-picker-indicator,input[type=month]::-webkit-calendar-picker-indicator{filter:invert(1)opacity(0.35)}`}</style>

```
  {/* Tithe Modal */}
  {titheModal && (
    <div style={S.modal}>
      <div style={S.modalBox}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🕊️</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>שאלת מעשרות</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, lineHeight: 1.6 }}>
          העברת ₪{homeTransfers.find(t => t.id === titheModal)?.amount.toLocaleString()} לבית.<br />
          <strong style={{ color: "#a78bfa" }}>האם נתת מעשרות על הסכום הזה?</strong><br />
          <span style={{ fontSize: 11 }}>(10% = ₪{((homeTransfers.find(t => t.id === titheModal)?.amount || 0) * 0.1).toFixed(0)})</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button style={{ ...S.btn("linear-gradient(135deg,#4ade80,#22c55e)"), padding: 10 }} onClick={() => answerTithe(titheModal, true)}>✅ כן, נתתי</button>
          <button style={{ ...S.btn("rgba(255,255,255,0.08)"), padding: 10, border: "1px solid rgba(255,255,255,0.12)" }} onClick={() => answerTithe(titheModal, false)}>🔔 לא עדיין</button>
        </div>
      </div>
    </div>
  )}

  {/* Header */}
  <div style={S.header}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>💅 סוכן פיננסי</h1>
      {activeAlerts.length > 0 && (
        <span style={{ background: "#f87171", color: "white", borderRadius: 99, fontSize: 11, padding: "2px 8px", fontWeight: 700 }}>{activeAlerts.length} התראות</span>
      )}
    </div>
    <nav style={S.nav}>
      {navItems.map(([k, l]) => <button key={k} style={S.nb(view === k)} onClick={() => setView(k)}>{l}</button>)}
    </nav>
  </div>

  <div style={S.p}>

    {/* ── DASHBOARD ── */}
    {view === "dashboard" && <>
      {/* Alerts */}
      {activeAlerts.map(a => (
        <div key={a.id} style={{ background: `${a.color}15`, border: `1px solid ${a.color}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{a.icon}</span>
          <span style={{ flex: 1, fontSize: 12, color: a.color, fontWeight: 600 }}>{a.text}</span>
          <button onClick={() => setAlertDismissed(p => ({ ...p, [a.id]: true }))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
        </div>
      ))}

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>סה"כ החודש</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>₪{totalSpent.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "left", fontSize: 11, color: "#64748b" }}>
            מתוך ₪{MONTHLY_BUDGET.toLocaleString()}<br />
            <span style={{ color: budgetPct > 85 ? "#f87171" : "#4ade80", fontWeight: 700 }}>{(100 - budgetPct).toFixed(0)}% נותר</span>
          </div>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
          <div style={{ width: `${budgetPct}%`, height: "100%", borderRadius: 99, background: budgetPct > 85 ? "linear-gradient(90deg,#f87171,#ef4444)" : "linear-gradient(90deg,#818cf8,#a78bfa)", transition: "width 1s" }} />
        </div>
        <div style={{ display: "flex", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[["🔁", "קבועות", recurringMonthlyTotal, "#a78bfa"], ["💸", "חד-פעמיות", expensesTotal, "#60a5fa"], ["🏠", "לבית", totalHomeTransfers, "#fb923c"]].map(([icon, label, val, c]) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: c, fontWeight: 700, fontSize: 13 }}>₪{val.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{icon} {label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["💳","אשראי",creditTotal,"#60a5fa"],["💵","מזומן",cashTotal,"#4ade80"],["🏦","העברה",bankTotal,"#facc15"]].map(([icon,label,val,c]) => (
          <div key={label} style={{ background: `${c}0e`, border: `1px solid ${c}2a`, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c }}>₪{val.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tithe summary */}
      {unpaidTithes.length > 0 && (
        <div style={{ ...S.card, background: "rgba(167,139,250,0.08)", borderColor: "#a78bfa33", cursor: "pointer" }} onClick={() => setView("home")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🕊️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>מעשרות פתוחות</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{unpaidTithes.length} העברות · לתת ₪{titheOwed.toFixed(0)}</div>
            </div>
            <span style={{ color: "#a78bfa", fontSize: 18 }}>←</span>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>הוצאות אחרונות</div>
        {expenses.slice(0, 5).map(e => (
          <div key={e.id} style={S.row}>
            <span style={{ fontSize: 20 }}>{CATEGORIES[e.category].icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.desc}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{e.date} · {PAYMENT_METHODS[e.payment].icon}</div>
            </div>
            <span style={{ fontWeight: 700 }}>₪{e.amount}</span>
          </div>
        ))}
      </div>
    </>}

    {/* ── CHARTS ── */}
    {view === "charts" && <>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>התפלגות הוצאות</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Donut segments={donutSegments} size={110} stroke={20} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>₪{totalSpent.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>סה"כ</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {categoryTotals.slice(0, 5).map(({ cat, total }) => {
              const c = CATEGORIES[cat];
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, flex: 1, color: "#94a3b8" }}>{c.icon} {c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>₪{total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>השוואת קטגוריות</div>
        <BarChart data={barData} height={110} />
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>תקציבים לפי קטגוריה</div>
        {Object.entries(CAT_BUDGETS).map(([cat, limit]) => {
          const spent = categoryTotals.find(c => c.cat === cat)?.total || 0;
          const pct = Math.min((spent / limit) * 100, 100);
          const over = spent > limit;
          const c = CATEGORIES[cat];
          return (
            <div key={cat} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span>{c.icon} {c.label}</span>
                <span style={{ color: over ? "#f87171" : "#94a3b8", fontWeight: over ? 700 : 400 }}>
                  ₪{spent} / ₪{limit} {over && "⚠️"}
                </span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: over ? "#f87171" : c.color, borderRadius: 99, opacity: 0.85 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>אשראי vs מזומן vs העברה</div>
        <BarChart data={[
          { label: "אשראי", value: creditTotal, color: "#60a5fa" },
          { label: "מזומן", value: cashTotal, color: "#4ade80" },
          { label: "העברה", value: bankTotal, color: "#facc15" },
          { label: "לבית", value: totalHomeTransfers, color: "#fb923c" },
        ]} height={100} />
      </div>
    </>}

    {/* ── GOALS ── */}
    {view === "goals" && <>
      {activeAlerts.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>🔔 התראות פעילות</div>
          {activeAlerts.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: a.color, fontWeight: 600 }}>{a.text}</span>
              <button onClick={() => setAlertDismissed(p => ({ ...p, [a.id]: true }))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {goals.map(g => {
        const pct = Math.min((g.current / g.target) * 100, 100);
        const left = g.target - g.current;
        return (
          <div key={g.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{g.icon} {g.label}</div>
              <div style={{ fontSize: 12, color: g.color, fontWeight: 700 }}>{pct.toFixed(0)}%</div>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: g.color, borderRadius: 99, transition: "width 1s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: g.color, fontWeight: 700 }}>₪{g.current.toLocaleString()}</span>
              <span style={{ color: "#64748b" }}>עוד ₪{left.toLocaleString()} ליעד</span>
              <span style={{ color: "#94a3b8" }}>₪{g.target.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {[100, 200, 500].map(amt => (
                <button key={amt} onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, current: Math.min(x.current + amt, x.target) } : x))}
                  style={{ flex: 1, padding: "6px 4px", background: `${g.color}15`, border: `1px solid ${g.color}33`, borderRadius: 8, color: g.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  +₪{amt}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>+ יעד חדש</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.inp} placeholder="שם היעד (לדוג׳ טיול לאירופה)" value={goalForm.label} onChange={e => setGoalForm(p => ({ ...p, label: e.target.value }))} />
          <input style={S.inp} type="number" placeholder="יעד ₪" value={goalForm.target} onChange={e => setGoalForm(p => ({ ...p, target: e.target.value }))} />
          <input style={S.inp} placeholder="אייקון (emoji)" value={goalForm.icon} onChange={e => setGoalForm(p => ({ ...p, icon: e.target.value }))} />
          <button style={S.btn("linear-gradient(135deg,#60a5fa,#3b82f6)")} onClick={() => {
            if (!goalForm.label || !goalForm.target) return;
            const colors = ["#60a5fa", "#4ade80", "#fb923c", "#f472b6", "#facc15", "#a78bfa"];
            setGoals(prev => [...prev, { id: Date.now(), label: goalForm.label, target: parseFloat(goalForm.target), current: 0, color: colors[prev.length % colors.length], icon: goalForm.icon || "🎯" }]);
            setGoalForm({ label: "", target: "", icon: "🎯" });
          }}>צור יעד</button>
        </div>
      </div>
    </>}

    {/* ── HOME TRANSFERS ── */}
    {view === "home" && <>
      <div style={{ ...S.card, background: "rgba(167,139,250,0.07)", borderColor: "#a78bfa2a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>🏠 העברות לבית</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fb923c" }}>₪{totalHomeTransfers.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <div><span style={{ color: "#4ade80", fontWeight: 700 }}>✅ שילמת מעשרות: </span>₪{homeTransfers.filter(t => t.tithePaid).reduce((s, t) => s + t.titheAmount, 0).toFixed(0)}</div>
          <div><span style={{ color: "#f87171", fontWeight: 700 }}>❌ חייבת: </span>₪{titheOwed.toFixed(0)}</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>+ העברה חדשה לבית</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.inp} type="number" placeholder="סכום ₪" value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} />
          <input style={S.inp} type="date" value={transferForm.date} onChange={e => setTransferForm(p => ({ ...p, date: e.target.value }))} />
          <input style={S.inp} placeholder="הערה (לדוג' קניות לאמא)" value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} />
          <button style={S.btn("linear-gradient(135deg,#fb923c,#f97316)")} onClick={addHomeTransfer}>הוסף העברה</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>היסטוריית העברות</div>
        {homeTransfers.map(t => (
          <div key={t.id} style={S.row}>
            <span style={{ fontSize: 20 }}>{t.tithePaid ? "✅" : "🔔"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.note || "העברה לבית"}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{t.date} · מעשרות: {t.tithePaid ? `₪${t.titheAmount}` : "לא שולמו"}</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700 }}>₪{t.amount.toLocaleString()}</div>
              {!t.tithePaid && (
                <button onClick={() => setTitheModal(t.id)} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 99, border: "none", background: "#a78bfa22", color: "#a78bfa", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, marginTop: 2 }}>שלמי מעשרות</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>}

    {/* ── ADD ── */}
    {view === "add" && <>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button style={S.sub(addSubView === "one-time")} onClick={() => setAddSubView("one-time")}>➕ חד פעמית</button>
        <button style={S.sub(addSubView === "receipt")} onClick={() => setAddSubView("receipt")}>🧾 חשבונית</button>
      </div>
      {addSubView === "one-time" && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>הוספת הוצאה</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={S.inp} placeholder="תיאור" value={addForm.desc} onChange={e => setAddForm(p => ({ ...p, desc: e.target.value }))} />
            <input style={S.inp} type="number" placeholder="סכום ₪" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} />
            <select style={S.sel} value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select style={S.sel} value={addForm.payment} onChange={e => setAddForm(p => ({ ...p, payment: e.target.value }))}>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input style={S.inp} type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} />
            <input style={S.inp} placeholder="פריטים (בפסיק, אופציונלי)" value={addForm.items} onChange={e => setAddForm(p => ({ ...p, items: e.target.value }))} />
            <button style={S.btn()} onClick={addExpense}>שמור הוצאה</button>
          </div>
        </div>
      )}
      {addSubView === "receipt" && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>ניתוח חשבונית</div>
          <textarea style={{ ...S.inp, minHeight: 160, marginBottom: 10 }}
            placeholder={"שופרסל\n08/04/2026\nלחם 12.90\nחלב 8.50\nסה\"כ: 21.40"}
            value={receiptText} onChange={e => setReceiptText(e.target.value)} />
          <button style={{ ...S.btn(), opacity: receiptLoading ? 0.7 : 1 }} onClick={parseReceipt} disabled={receiptLoading}>
            {receiptLoading ? "⏳ מנתח..." : "🔍 נתח חשבונית"}
          </button>
        </div>
      )}
    </>}

    {/* ── RECURRING ── */}
    {view === "recurring" && <>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🔁 הוצאות קבועות</div>
          <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700 }}>₪{recurringMonthlyTotal}/חודש</div>
        </div>
        {recurring.map(r => (
          <div key={r.id} style={{ ...S.row, opacity: r.active ? 1 : 0.4 }}>
            <span style={{ fontSize: 20 }}>{CATEGORIES[r.category].icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.desc}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{RECUR_FREQ[r.freq]} · יום {r.dayOfMonth} · {PAYMENT_METHODS[r.payment].icon}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontWeight: 700 }}>₪{r.amount}</span>
              <button onClick={() => setRecurring(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))}
                style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, border: "none", cursor: "pointer", background: r.active ? "#f8717120" : "#4ade8020", color: r.active ? "#f87171" : "#4ade80", fontFamily: "inherit", fontWeight: 700 }}>
                {r.active ? "השהה" : "הפעל"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>+ הוספת הוצאה קבועה</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.inp} placeholder="תיאור" value={recurForm.desc} onChange={e => setRecurForm(p => ({ ...p, desc: e.target.value }))} />
          <input style={S.inp} type="number" placeholder="סכום ₪" value={recurForm.amount} onChange={e => setRecurForm(p => ({ ...p, amount: e.target.value }))} />
          <select style={S.sel} value={recurForm.category} onChange={e => setRecurForm(p => ({ ...p, category: e.target.value }))}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select style={S.sel} value={recurForm.payment} onChange={e => setRecurForm(p => ({ ...p, payment: e.target.value }))}>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select style={S.sel} value={recurForm.freq} onChange={e => setRecurForm(p => ({ ...p, freq: e.target.value }))}>
              <option value="monthly">חודשי</option><option value="weekly">שבועי</option><option value="yearly">שנתי</option>
            </select>
            <input style={S.inp} type="number" min="1" max="31" placeholder="יום בחודש" value={recurForm.dayOfMonth} onChange={e => setRecurForm(p => ({ ...p, dayOfMonth: e.target.value }))} />
          </div>
          <button style={S.btn("linear-gradient(135deg,#4ade80,#22c55e)")} onClick={() => {
            if (!recurForm.desc || !recurForm.amount) return;
            setRecurring(prev => [...prev, { id: Date.now(), ...recurForm, amount: parseFloat(recurForm.amount), dayOfMonth: parseInt(recurForm.dayOfMonth), active: true }]);
            setRecurForm({ desc: "", amount: "", category: "utilities", payment: "bank", freq: "monthly", dayOfMonth: "1" });
          }}>הוסף הוצאה קבועה</button>
        </div>
      </div>
    </>}

    {/* ── BANK ── */}
    {view === "bank" && <>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button style={S.sub(bankSubView === "summary")} onClick={() => setBankSubView("summary")}>📋 סיכום</button>
        <button style={S.sub(bankSubView === "add")} onClick={() => setBankSubView("add")}>+ הוסף עמלה</button>
      </div>
      {bankSubView === "summary" && <>
        <div style={S.card}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>בחר חודש</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[...new Set(bankFees.map(f => f.month))].sort().reverse().map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)} style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, background: selectedMonth === m ? "linear-gradient(135deg,#818cf8,#a78bfa)" : "rgba(255,255,255,0.07)", color: selectedMonth === m ? "white" : "#94a3b8" }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>עמלות {selectedMonth}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f87171" }}>₪{monthFeesTotal}</div>
          </div>
          {monthFees.length === 0
            ? <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 16 }}>אין עמלות לחודש זה</div>
            : monthFees.map(f => (
              <div key={f.id} style={S.row}>
                <span style={{ fontSize: 18 }}>{f.type === "fee" ? "💸" : "📈"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.desc}</div>
                </div>
                <span style={{ fontWeight: 700, color: "#f87171" }}>₪{f.amount}</span>
              </div>
            ))
          }
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>מגמת עמלות</div>
          <BarChart data={Object.entries(feesByMonth).sort().map(([m, v]) => ({ label: m.slice(5), value: v, color: "#f87171" }))} height={90} />
        </div>
      </>}
      {bankSubView === "add" && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>הוספת עמלת בנק</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={S.inp} placeholder="תיאור" value={feeForm.desc} onChange={e => setFeeForm(p => ({ ...p, desc: e.target.value }))} />
            <input style={S.inp} type="number" placeholder="סכום ₪" value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} />
            <input style={S.inp} type="month" value={feeForm.month} onChange={e => setFeeForm(p => ({ ...p, month: e.target.value }))} />
            <select style={S.sel} value={feeForm.type} onChange={e => setFeeForm(p => ({ ...p, type: e.target.value }))}>
              <option value="fee">💸 עמלה</option><option value="interest">📈 ריבית</option>
            </select>
            <button style={S.btn("linear-gradient(135deg,#f87171,#ef4444)")} onClick={() => {
              if (!feeForm.desc || !feeForm.amount) return;
              setBankFees(prev => [...prev, { id: Date.now(), ...feeForm, amount: parseFloat(feeForm.amount) }]);
              setFeeForm({ desc: "", amount: "", month: "2026-04", type: "fee" });
            }}>הוסף עמלה</button>
          </div>
        </div>
      )}
    </>}

    {/* ── RECEIPT ── */}
    {view === "receipt" && (
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🧾 ניתוח חשבונית</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>הדבק טקסט קבלה — אחלץ פריטים ואוסיף אוטומטית</div>
        <textarea style={{ ...S.inp, minHeight: 170, marginBottom: 12 }}
          placeholder={"שופרסל\n08/04/2026\nלחם אחיד 12.90\nחלב תנובה 8.50\nסה\"כ: 21.40"}
          value={receiptText} onChange={e => setReceiptText(e.target.value)} />
        <button style={{ ...S.btn(), opacity: receiptLoading ? 0.7 : 1 }} onClick={parseReceipt} disabled={receiptLoading}>
          {receiptLoading ? "⏳ מנתח..." : "🔍 נתח חשבונית"}
        </button>
      </div>
    )}

    {/* ── CHAT ── */}
    {view === "chat" && (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 215px)" }}>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12, display: "flex", flexDirection: "column" }}>
          {aiMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={S.bubble(msg.role === "user")}>{msg.text}</div>
            </div>
          ))}
          {loading && <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={S.bubble(false)}>⏳ חושבת...</div></div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <input style={{ ...S.inp, flex: 1 }} placeholder="שאלי אותי כל שאלה פיננסית..." value={aiInput}
            onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAISend()} />
          <button style={{ ...S.btn(), width: "auto", padding: "10px 14px", fontSize: 16 }} onClick={handleAISend} disabled={loading}>➤</button>
        </div>
      </div>
    )}

  </div>
</div>
```

);
}
