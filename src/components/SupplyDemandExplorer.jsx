import { useState, useMemo } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceDot, ReferenceArea,
  ResponsiveContainer, Tooltip, BarChart, Bar, Cell
} from "recharts";

/* ─── Economics Model ───
   Demand:  Qd = 80 − 8P   (at P=0 → Qd=80, at P=10 → Qd=0)
   Supply:  Qs = 8P         (at P=0 → Qs=0,  at P=10 → Qs=80)
   Equilibrium: P=$5, Q=40
   Marginal cost of qth unit = q/8 (same as supply curve)
   Total cost of Q units = Q²/16
*/

const EQ_PRICE = 5;
const EQ_QTY = 40;

function getQd(p) { return Math.max(0, 80 - 8 * p); }
function getQs(p) { return Math.max(0, 8 * p); }
function totalCost(q) { return (q * q) / 16; }
function marginalCost(q) { return q / 8; }

function getMetrics(price) {
  const qd = getQd(price);
  const qs = getQs(price);
  const sold = Math.min(qd, qs);
  const surplus = Math.max(0, qs - qd);
  const shortage = Math.max(0, qd - qs);
  const revenue = price * sold;
  const prodCost = totalCost(qs);
  const soldCost = totalCost(sold);
  const wasteCost = prodCost - soldCost;
  const profit = revenue - prodCost;
  return { qd, qs, sold, surplus, shortage, revenue, prodCost, wasteCost, profit };
}

// Curve data for charts
const curveData = [];
for (let q = 0; q <= 82; q += 2) {
  curveData.push({
    quantity: q,
    demandPrice: Math.max(0, 10 - q / 8),
    supplyPrice: q / 8,
  });
}

// Profit at every price for the bar chart
function buildProfitData() {
  const d = [];
  for (let p = 0.5; p <= 9.5; p += 0.5) {
    d.push({ priceLabel: `$${p % 1 === 0 ? p : p.toFixed(1)}`, price: p, profit: Math.round(getMetrics(p).profit) });
  }
  return d;
}
const profitByPrice = buildProfitData();

// ─── Shared Components ───

function PriceSlider({ price, setPrice, min = 0.5, max = 9.5, step = 0.5 }) {
  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-500">Low price</span>
        <span className="text-lg font-bold text-gray-800">
          Price: <span className="text-emerald-700">${price.toFixed(2)}</span>
        </span>
        <span className="text-sm font-medium text-gray-500">High price</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={price}
        onChange={e => setPrice(parseFloat(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        style={{ background: `linear-gradient(to right, #3B82F6, #10B981 ${((price - min) / (max - min)) * 100}%, #F97316)` }}
      />
    </div>
  );
}

function MetricCard({ label, value, sub, colour = "gray" }) {
  const colours = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-xl border p-3 ${colours[colour]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
    </div>
  );
}

function StatusBadge({ surplus, shortage }) {
  if (surplus === 0 && shortage === 0) {
    return <span className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg border-2 border-emerald-300 animate-pulse">EQUILIBRIUM</span>;
  }
  if (surplus > 0) {
    return <span className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-800 font-bold text-lg border-2 border-red-300">SURPLUS — {surplus} unsold</span>;
  }
  return <span className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-bold text-lg border-2 border-amber-300">SHORTAGE — {shortage} unmet demand</span>;
}

// ─── Tab: Demand ───

function DemandTab() {
  const [price, setPrice] = useState(5);
  const qd = getQd(price);

  return (
    <div>
      <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-2">The Law of Demand</h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          The demand curve shows how many customers want to buy at each price.
          When the price is <strong>low</strong>, more people want to buy.
          When the price is <strong>high</strong>, fewer people are interested.
          This is because customers look for the best value — if something costs too much, they will go without it or find an alternative.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={curveData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="quantity" label={{ value: "Quantity (pies)", position: "bottom", offset: 0 }} domain={[0, 80]} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: "Price ($)", angle: -90, position: "insideLeft", offset: 10 }} domain={[0, 10]} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Line type="monotone" dataKey="demandPrice" stroke="#3B82F6" strokeWidth={3} dot={false} name="Demand" />
            <ReferenceLine y={price} stroke="#3B82F6" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `P = $${price.toFixed(2)}`, position: "right", fill: "#3B82F6", fontSize: 12 }} />
            {qd > 0 && <ReferenceDot x={qd} y={price} r={7} fill="#3B82F6" stroke="#fff" strokeWidth={2} />}
            <ReferenceLine x={qd} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <PriceSlider price={price} setPrice={setPrice} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <MetricCard label="Price per pie" value={`$${price.toFixed(2)}`} colour="blue" />
        <MetricCard label="Customers who want to buy" value={qd} sub={qd > 60 ? "Very high demand!" : qd > 30 ? "Moderate demand" : qd > 10 ? "Low demand" : "Almost no demand"} colour="blue" />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
        {price <= 2 && <p>At just <strong>${price.toFixed(2)}</strong> per pie, <strong>{qd} customers</strong> want to buy! Low prices attract lots of buyers — everyone loves a bargain.</p>}
        {price > 2 && price < 5 && <p>At <strong>${price.toFixed(2)}</strong> per pie, <strong>{qd} customers</strong> are willing to buy. As the price rises, some customers decide it is not worth it and drop out of the market.</p>}
        {price >= 5 && price < 8 && <p>At <strong>${price.toFixed(2)}</strong> per pie, only <strong>{qd} customers</strong> want to buy. The higher price puts many people off — they might choose a cheaper alternative or go without.</p>}
        {price >= 8 && <p>At <strong>${price.toFixed(2)}</strong> per pie, barely anyone wants to buy — just <strong>{qd} customers</strong>. Most people think this is far too expensive.</p>}
      </div>
    </div>
  );
}

// ─── Tab: Supply ───

function SupplyTab() {
  const [price, setPrice] = useState(5);
  const qs = getQs(price);
  const cost = totalCost(qs);
  const avgCost = qs > 0 ? cost / qs : 0;

  // Cost breakdown for each batch of 10
  const costBreakdown = useMemo(() => {
    const batches = [];
    for (let start = 1; start <= Math.min(qs, 80); start += 10) {
      const end = Math.min(start + 9, qs);
      const batchCost = totalCost(end) - totalCost(start - 1);
      const avgPerItem = batchCost / (end - start + 1);
      const profitable = avgPerItem < price;
      batches.push({ label: `Pies ${start}–${end}`, avgPerItem, profitable, batchCost });
    }
    return batches;
  }, [price, qs]);

  return (
    <div>
      <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-100">
        <h3 className="font-bold text-orange-900 mb-2">The Law of Supply</h3>
        <p className="text-orange-800 text-sm leading-relaxed">
          The supply curve shows how many items a producer is willing to make at each price.
          Each additional pie costs <strong>a bit more</strong> to produce — the first few pies are cheap (you have ingredients and time),
          but the more you make, the more it costs (overtime, buying extra ingredients at higher prices, working harder).
          A producer will only make a pie if they can sell it for <strong>more than it costs to make</strong>.
          That is why higher prices mean more supply — there is more room to cover costs and still make a profit.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={curveData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="quantity" label={{ value: "Quantity (pies)", position: "bottom", offset: 0 }} domain={[0, 80]} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: "Price / Cost ($)", angle: -90, position: "insideLeft", offset: 10 }} domain={[0, 10]} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Line type="monotone" dataKey="supplyPrice" stroke="#F97316" strokeWidth={3} dot={false} name="Supply (Marginal Cost)" />
            <ReferenceLine y={price} stroke="#F97316" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `P = $${price.toFixed(2)}`, position: "right", fill: "#F97316", fontSize: 12 }} />
            {qs > 0 && qs <= 80 && <ReferenceDot x={qs} y={price} r={7} fill="#F97316" stroke="#fff" strokeWidth={2} />}
            <ReferenceLine x={qs > 80 ? 80 : qs} stroke="#F97316" strokeDasharray="3 3" strokeWidth={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <PriceSlider price={price} setPrice={setPrice} />

      <div className="grid grid-cols-3 gap-3 mt-4">
        <MetricCard label="Selling price" value={`$${price.toFixed(2)}`} colour="orange" />
        <MetricCard label="Pies you'll produce" value={qs} colour="orange" />
        <MetricCard label="Avg cost per pie" value={qs > 0 ? `$${avgCost.toFixed(2)}` : "—"} sub={qs > 0 ? `Total: $${cost.toFixed(2)}` : ""} colour="orange" />
      </div>

      {/* Cost breakdown table */}
      {qs > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-orange-100 px-4 py-2 border-b border-gray-200">
            <h4 className="font-bold text-orange-900 text-sm">Why do you stop at {qs} pies? Cost breakdown per batch</h4>
          </div>
          <div className="p-3">
            <div className="grid gap-2">
              {costBreakdown.map((b, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${b.profitable ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  <span className="font-medium">{b.label}</span>
                  <span>avg cost: <strong>${b.avgPerItem.toFixed(2)}</strong>/pie</span>
                  <span className="font-bold">{b.profitable ? "Profitable" : "Would lose money!"}</span>
                </div>
              ))}
              {qs < 80 && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-red-50 text-red-800">
                  <span className="font-medium">Pie #{qs + 1}</span>
                  <span>would cost: <strong>${marginalCost(qs + 1).toFixed(2)}</strong></span>
                  <span className="font-bold">More than ${price.toFixed(2)} — STOP</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
        {price <= 2 && <p>At only <strong>${price.toFixed(2)}</strong> per pie, you can only afford to make <strong>{qs} pies</strong>. The selling price barely covers your costs, so there is very little room for profit.</p>}
        {price > 2 && price < 5 && <p>At <strong>${price.toFixed(2)}</strong>, you will produce <strong>{qs} pies</strong>. As the price increases, you can cover the cost of making more pies and still earn a profit on each one, so you are willing to supply more.</p>}
        {price >= 5 && price < 8 && <p>At <strong>${price.toFixed(2)}</strong>, you produce <strong>{qs} pies</strong>. The higher price means even the more expensive later pies are still worth making — you stop when the next pie would cost more than you can sell it for.</p>}
        {price >= 8 && <p>At <strong>${price.toFixed(2)}</strong> you are producing <strong>{qs} pies</strong>! The high price makes it worth pushing production hard — but those last pies are very expensive to make.</p>}
      </div>
    </div>
  );
}

// ─── Tab: Equilibrium ───

function EquilibriumTab() {
  const [price, setPrice] = useState(5);
  const m = getMetrics(price);
  const isEquilibrium = m.surplus === 0 && m.shortage === 0;
  const maxProfit = getMetrics(EQ_PRICE).profit;

  return (
    <div>
      <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
        <h3 className="font-bold text-emerald-900 mb-2">Finding Equilibrium — The Sweet Spot</h3>
        <p className="text-emerald-800 text-sm leading-relaxed">
          Now let us put supply and demand together. You choose a price, produce that many pies (based on your costs),
          and then see how many customers actually show up. Can you find the price where you <strong>sell everything you make</strong> and <strong>maximise your profit</strong>?
        </p>
      </div>

      {/* Main chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={curveData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="quantity" label={{ value: "Quantity (pies)", position: "bottom", offset: 0 }} domain={[0, 80]} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: "Price ($)", angle: -90, position: "insideLeft", offset: 10 }} domain={[0, 10]} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />

            {/* Surplus shading (red) or shortage shading (amber) */}
            {m.surplus > 0 && (
              <ReferenceArea x1={m.qd} x2={m.qs} y1={0} y2={price} fill="#EF4444" fillOpacity={0.08} />
            )}
            {m.shortage > 0 && (
              <ReferenceArea x1={m.qs} x2={m.qd} y1={0} y2={price} fill="#F59E0B" fillOpacity={0.08} />
            )}

            {/* Curves */}
            <Line type="monotone" dataKey="demandPrice" stroke="#3B82F6" strokeWidth={3} dot={false} name="Demand" />
            <Line type="monotone" dataKey="supplyPrice" stroke="#F97316" strokeWidth={3} dot={false} name="Supply" />

            {/* Equilibrium point (always shown) */}
            <ReferenceDot x={EQ_QTY} y={EQ_PRICE} r={8} fill="#10B981" stroke="#fff" strokeWidth={2} label={{ value: "E", position: "top", fill: "#10B981", fontWeight: "bold", fontSize: 14 }} />

            {/* Current price line */}
            <ReferenceLine y={price} stroke="#6B7280" strokeDasharray="8 4" strokeWidth={1.5} />

            {/* Quantity supplied dot */}
            {m.qs > 0 && m.qs <= 80 && (
              <ReferenceDot x={m.qs} y={price} r={6} fill="#F97316" stroke="#fff" strokeWidth={2} />
            )}
            {/* Quantity demanded dot */}
            {m.qd > 0 && m.qd <= 80 && (
              <ReferenceDot x={m.qd} y={price} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
            )}

            {/* Vertical dashed lines from dots to x-axis */}
            {m.qs > 0 && m.qs <= 80 && <ReferenceLine x={m.qs} stroke="#F97316" strokeDasharray="3 3" strokeWidth={1} />}
            {m.qd > 0 && m.qd <= 80 && m.qd !== m.qs && <ReferenceLine x={m.qd} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={1} />}
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2 text-sm">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Demand</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Supply</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Equilibrium</span>
        </div>
      </div>

      {/* Price slider */}
      <PriceSlider price={price} setPrice={setPrice} />

      {/* Status badge */}
      <div className="text-center mt-4 mb-4">
        <StatusBadge surplus={m.surplus} shortage={m.shortage} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <MetricCard label="You produced" value={`${m.qs} pies`} sub={`Total production cost: $${m.prodCost.toFixed(2)}`} colour="orange" />
        <MetricCard label="Customers wanted" value={`${m.qd} pies`} sub={m.surplus > 0 ? `${m.surplus} pies unsold!` : m.shortage > 0 ? `${m.shortage} customers missed out` : "Perfect match!"} colour="blue" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard label="Revenue" value={`$${m.revenue.toFixed(2)}`} sub={`${m.sold} sold × $${price.toFixed(2)}`} colour="green" />
        <MetricCard
          label="Wasted stock"
          value={m.wasteCost > 0 ? `$${m.wasteCost.toFixed(2)}` : "$0"}
          sub={m.surplus > 0 ? `${m.surplus} pies thrown away` : "No waste!"}
          colour={m.wasteCost > 0 ? "red" : "gray"}
        />
        <MetricCard
          label="Profit"
          value={`$${m.profit.toFixed(2)}`}
          sub={isEquilibrium ? "Maximum profit!" : `Max possible: $${maxProfit.toFixed(2)}`}
          colour={m.profit > 0 ? "green" : "red"}
        />
      </div>

      {/* Dynamic explanation */}
      <div className={`p-4 rounded-xl border text-sm leading-relaxed mb-4 ${isEquilibrium ? "bg-emerald-50 border-emerald-200 text-emerald-800" : m.surplus > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
        {isEquilibrium && (
          <p><strong>You found it!</strong> At <strong>${price.toFixed(2)}</strong>, you produce exactly <strong>{m.qs} pies</strong> and exactly <strong>{m.qd} customers</strong> want to buy.
          Every pie gets sold, nothing goes to waste, and your profit is at its maximum of <strong>${m.profit.toFixed(2)}</strong>.
          This is <strong>equilibrium</strong> — the price where supply equals demand.</p>
        )}
        {m.surplus > 0 && (
          <p><strong>Price too high!</strong> At <strong>${price.toFixed(2)}</strong>, you produce <strong>{m.qs} pies</strong> but only <strong>{m.qd} customers</strong> want to buy.
          That leaves <strong>{m.surplus} pies unsold</strong> — you still paid to make them, so <strong>${m.wasteCost.toFixed(2)}</strong> is wasted on stock nobody bought.
          {m.profit < 0 ? ` You are actually making a loss of $${Math.abs(m.profit).toFixed(2)}!` : ` Your profit drops to just $${m.profit.toFixed(2)}.`}
          {" "}Try lowering the price towards equilibrium.</p>
        )}
        {m.shortage > 0 && (
          <p><strong>Price too low!</strong> At <strong>${price.toFixed(2)}</strong>, <strong>{m.qd} customers</strong> want to buy but you only produce <strong>{m.qs} pies</strong>.
          There is no waste, but you are missing out on sales. With such a low margin on each pie, your total profit is only <strong>${m.profit.toFixed(2)}</strong>.
          {" "}Try raising the price towards equilibrium.</p>
        )}
      </div>

      {/* Profit across all prices */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="font-bold text-gray-800 mb-1 text-sm">Profit at every price — can you see the peak?</h4>
        <p className="text-xs text-gray-500 mb-3">This chart shows what your profit would be at each price. The green dot marks your current price.</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={profitByPrice} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="priceLabel" tick={{ fontSize: 10 }} interval={1} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v) => [`$${v}`, "Profit"]} />
            <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
              {profitByPrice.map((entry, i) => {
                const isCurrent = Math.abs(entry.price - price) < 0.01;
                const isEq = Math.abs(entry.price - EQ_PRICE) < 0.01;
                let fill = entry.profit >= 0 ? "#86EFAC" : "#FCA5A5";
                if (isCurrent) fill = entry.profit >= 0 ? "#16A34A" : "#DC2626";
                if (isEq && !isCurrent) fill = "#10B981";
                return <Cell key={i} fill={fill} stroke={isCurrent ? "#000" : "none"} strokeWidth={isCurrent ? 2 : 0} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key takeaway */}
      <div className="mt-4 p-4 bg-gray-900 text-white rounded-xl text-sm leading-relaxed">
        <h4 className="font-bold text-emerald-400 mb-2">Key Takeaway</h4>
        <p>
          <strong>Equilibrium is not just where the lines cross on a graph</strong> — it is the price where the producer makes the
          most profit. Set the price too high and you overproduce, waste stock, and lose money. Set it too low
          and you sell cheaply with tiny margins. At equilibrium ($5.00, 40 pies), supply matches demand perfectly:
          no waste, no missed customers, maximum profit.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───

const TABS = [
  { label: "1. Demand", colour: "blue" },
  { label: "2. Supply", colour: "orange" },
  { label: "3. Equilibrium", colour: "emerald" },
];

export default function SupplyDemandExplorer() {
  const [tab, setTab] = useState(0);

  const tabColours = {
    blue: { active: "bg-blue-600 text-white", inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
    orange: { active: "bg-orange-500 text-white", inactive: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    emerald: { active: "bg-emerald-600 text-white", inactive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supply &amp; Demand Explorer</h1>
        <p className="text-gray-500 text-sm mt-1">Use the sliders to explore how price affects supply, demand, and profit</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${tab === i ? tabColours[t.colour].active : tabColours[t.colour].inactive}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <DemandTab />}
      {tab === 1 && <SupplyTab />}
      {tab === 2 && <EquilibriumTab />}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-8 pb-4">
        Year 11 Commerce — Westlake Boys High School
      </div>
    </div>
  );
}
