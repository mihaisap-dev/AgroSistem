import React, { useState, useEffect, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────
// CONFIGURARE API
// ─────────────────────────────────────────────
const API_URL = "http://127.0.0.1:5001/api";

// ─────────────────────────────────────────────
// CULORI ȘI STILURI
// ─────────────────────────────────────────────
const C = {
  earth: "#3d2c1e",
  forest: "#1a472a",
  forestLight: "#2d6a4f",
  wheat: "#dda15e",
  wheatLight: "#e9c46a",
  cream: "#fefae0",
  soil: "#6b4423",
  sky: "#b7e4c7",
  skyDark: "#95d5b2",
  danger: "#c1121f",
  warn: "#e36414",
  warnBg: "#fff3cd",
  white: "#ffffff",
  text: "#1b1b1e",
  textMuted: "#555b5e",
  border: "#d4c5a9",
  bg: "#f8f5ec",
  bgCard: "#ffffff",
  shadow: "0 2px 12px rgba(61,44,30,0.08)",
  success: "#2d6a4f",
  successBg: "#d4edda",
};

// ─────────────────────────────────────────────
// HELPER: API FETCH
// ─────────────────────────────────────────────
async function api(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Eroare server");
  return data;
}

// ─────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────
function exportCSV(headers, rows, filename) {
  const escape = (v) => {
    const s = String(v == null ? "" : v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// COMPONENTE REUTILIZABILE
// ─────────────────────────────────────────────
function Card({ children, title, style, actions }) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20, boxShadow: C.shadow, ...style }}>
      {(title || actions) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          {title && <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.earth }}>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style, disabled, title }) {
  const styles = {
    primary: { background: C.forest, color: C.white, border: "none" },
    secondary: { background: "transparent", color: C.forest, border: `1px solid ${C.forestLight}` },
    danger: { background: C.danger, color: C.white, border: "none" },
    wheat: { background: C.wheat, color: C.earth, border: "none" },
    small: { background: "transparent", color: C.forest, border: `1px solid ${C.border}`, padding: "4px 10px", fontSize: 12 },
    smallDanger: { background: "transparent", color: C.danger, border: `1px solid ${C.danger}`, padding: "4px 10px", fontSize: 12 },
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "all 0.2s", ...styles[variant], ...style,
    }}>{children}</button>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: props.flex || 1 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>}
      <input {...props} style={{
        padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
        fontSize: 14, background: C.white, color: C.text, outline: "none", ...props.style,
      }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: props.flex || 1 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>}
      <select {...props} style={{
        padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
        fontSize: 14, background: C.white, color: C.text, cursor: "pointer", ...props.style,
      }}>
        <option value="">— Alege —</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div style={{ background: C.warnBg, border: `1px solid ${C.warn}`, borderRadius: 8, padding: "10px 14px", color: C.warn, fontSize: 13, fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 18 }}>&#9888;</span>{children}
    </div>
  );
}

function SuccessMsg({ children }) {
  return (
    <div style={{ background: C.successBg, border: `1px solid ${C.success}`, borderRadius: 8, padding: "10px 14px", color: C.success, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: "left", padding: "10px 12px", background: C.bg, color: C.earth,
                fontWeight: 600, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                fontSize: 12, textTransform: "uppercase", letterSpacing: "0.3px",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{ padding: 24, textAlign: "center", color: C.textMuted, fontStyle: "italic" }}>
              Nicio inregistrare gasita.
            </td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "10px 12px", color: C.text }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDelete({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: C.text }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel}>Anuleaza</Btn>
          <Btn variant="danger" onClick={onConfirm}>Sterge</Btn>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 10, padding: "16px 20px", border: `1px solid ${C.border}`, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || C.forest }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HARTĂ PARCELE (SVG)
// ─────────────────────────────────────────────
function ParcelMap({ blocks, seasons }) {
  const parcels = blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber })));
  const maxArea = Math.max(...parcels.map((p) => p.areaHa), 1);
  const colors = ["#2d6a4f", "#6b4423", "#dda15e", "#e36414", "#264653", "#e76f51", "#606c38", "#8d6346"];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${Math.max(blocks.length * 200, 680)} 240`} width="100%" style={{ minWidth: 400 }}>
        {blocks.map((block, bi) => {
          const bParcels = parcels.filter((p) => p.blockId === block.id);
          const col = colors[bi % colors.length];
          const bx = bi * 190 + 20;
          let py = 50;
          return (
            <g key={block.id}>
              <rect x={bx} y={10} width={170} height={220} rx={10} fill={col + "18"} stroke={col} strokeWidth={1.5} strokeDasharray="6 3" />
              <text x={bx + 85} y={32} textAnchor="middle" fontSize={12} fontWeight={600} fill={col}>Bloc {block.blockNumber}</text>
              {bParcels.map((p) => {
                const h = Math.max(22, (p.areaHa / maxArea) * 80);
                const y = py;
                py += h + 6;
                const ps = seasons.find((s) => s.parcelId === p.id);
                return (
                  <g key={p.id}>
                    <rect x={bx + 10} y={y} width={150} height={h} rx={4} fill={col + "44"} stroke={col} strokeWidth={0.8} />
                    <text x={bx + 18} y={y + h / 2 + 1} fontSize={10} fill={col} dominantBaseline="central">P{p.parcelNumber} — {p.areaHa} ha</text>
                    {ps?.cultura && <text x={bx + 152} y={y + h / 2 + 1} fontSize={9} fill="#555" dominantBaseline="central" textAnchor="end">{ps.cultura.name.substring(0, 12)}</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// ECRAN AUTENTIFICARE
// ─────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !pass) return setErr("Completeaza toate campurile.");
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? { name, email, password: pass } : { email, password: pass };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Eroare la autentificare");
      onLogin(data.user, data.token);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${C.earth} 0%, ${C.forest} 50%, ${C.forestLight} 100%)` }}>
      <div style={{ background: C.white, borderRadius: 16, padding: 40, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.wheat}, ${C.wheatLight})`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: C.earth, marginBottom: 12 }}>A</div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 28, color: C.earth }}>AgroSistem</h1>
          <p style={{ margin: "8px 0 0", color: C.textMuted, fontSize: 14 }}>Management agricol & APIA</p>
        </div>
        <div style={{ display: "flex", marginBottom: 24, background: C.bg, borderRadius: 8, padding: 3 }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500, background: mode === "login" ? C.white : "transparent", color: mode === "login" ? C.forest : C.textMuted, boxShadow: mode === "login" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Autentificare</button>
          <button onClick={() => setMode("register")} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500, background: mode === "register" ? C.white : "transparent", color: mode === "register" ? C.forest : C.textMuted, boxShadow: mode === "register" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Cont nou</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && <Input label="Nume complet" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ion Popescu" />}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplu.ro" />
          <Input label="Parola" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="********" onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        {err && <p style={{ color: C.danger, fontSize: 13, marginTop: 8 }}>{err}</p>}
        <Btn onClick={handleSubmit} style={{ width: "100%", marginTop: 20, padding: "12px 0", fontSize: 15, borderRadius: 8 }} disabled={loading}>
          {loading ? "Se incarca..." : mode === "register" ? "Creeaza cont" : "Intra in cont"}
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIGURARE FERMĂ
// ─────────────────────────────────────────────
function FarmSetup({ token, onCreated }) {
  const [name, setName] = useState("");
  const [cui, setCui] = useState("");
  const [loc, setLoc] = useState("");
  const [county, setCounty] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const data = await api("/farms", token, { method: "POST", body: { name, cui, locality: loc, county, iban, bank } });
      onCreated(data.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Adaugare ferma noua">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Denumire ferma / exploatatie" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ferma Deleni" />
        <Input label="CUI / Cod fiscal" value={cui} onChange={(e) => setCui(e.target.value)} />
        <Input label="Localitate" value={loc} onChange={(e) => setLoc(e.target.value)} />
        <Input label="Judet" value={county} onChange={(e) => setCounty(e.target.value)} />
        <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
        <Input label="Banca" value={bank} onChange={(e) => setBank(e.target.value)} />
      </div>
      <Btn onClick={create} style={{ marginTop: 16 }} disabled={!name || loading}>Creeaza exploatatia</Btn>
    </Card>
  );
}

// ─────────────────────────────────────────────
// TAB 0: DASHBOARD
// ─────────────────────────────────────────────
function TabDashboard({ blocks, seasons, harvests, works }) {
  const allParcels = blocks.flatMap((b) => b.parcele || []);
  const totalArea = allParcels.reduce((s, p) => s + p.areaHa, 0);
  const currentYear = new Date().getFullYear();
  const currentSeasons = seasons.filter((s) => s.year === currentYear);
  const uniqueCrops = [...new Set(currentSeasons.map((s) => s.cultura?.name).filter(Boolean))];

  return (
    <>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatBox label="Suprafata totala (ha)" value={Math.round(totalArea * 100) / 100} color={C.forest} />
        <StatBox label="Blocuri fizice" value={blocks.length} color={C.soil} />
        <StatBox label="Parcele" value={allParcels.length} color={C.wheat} />
        <StatBox label={`Culturi active ${currentYear}`} value={uniqueCrops.length} color={C.forestLight} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card title="Ultimele blocuri fizice">
          <Table headers={["Nr. Bloc", "Localitate", "Parcele"]} rows={blocks.slice(0, 5).map((b) => [b.blockNumber, b.locality || "-", (b.parcele || []).length])} />
        </Card>
        <Card title={`Culturi ${currentYear}`}>
          <Table headers={["Parcela", "Cultura", "Sezon"]} rows={currentSeasons.slice(0, 8).map((s) => [`B${s.parcel?.block?.blockNumber}/P${s.parcel?.parcelNumber}`, s.cultura?.name || "-", s.season])} />
        </Card>
      </div>
      {blocks.length > 0 && <Card title="Harta exploatatie (SVG)"><ParcelMap blocks={blocks} seasons={seasons} /></Card>}
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 1: TERENURI
// ─────────────────────────────────────────────
function TabTerenuri({ farmId, token, blocks, seasons, onRefresh }) {
  const [blockNr, setBlockNr] = useState("");
  const [blockName, setBlockName] = useState("");
  const [blocLoc, setBlocLoc] = useState("");
  const [blocCounty, setBlocCounty] = useState("");
  const [sirutaCode, setSirutaCode] = useState("");
  const [parcelNr, setParcelNr] = useState("");
  const [area, setArea] = useState("");
  const [selBlock, setSelBlock] = useState("");
  const [cat, setCat] = useState("TA");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editBlock, setEditBlock] = useState(null);
  const [editParcel, setEditParcel] = useState(null);

  const addBlock = async () => {
    if (!blockNr) return;
    setLoading(true);
    try {
      await api("/blocks", token, { method: "POST", body: { farmId, blockNumber: blockNr, name: blockName, sirutaCode: sirutaCode, locality: blocLoc, county: blocCounty } });
      onRefresh();
      setBlockNr(""); setBlockName(""); setBlocLoc(""); setBlocCounty(""); setSirutaCode("");
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const addParcel = async () => {
    if (!selBlock || !parcelNr || !area) return;
    setLoading(true);
    try {
      await api("/parcels", token, { method: "POST", body: { blockId: Number(selBlock), parcelNumber: Number(parcelNr), areaHa: Number(area), landCategory: cat } });
      onRefresh();
      setParcelNr(""); setArea("");
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/${deleteTarget.type}/${deleteTarget.id}`, token, { method: "DELETE" });
      onRefresh();
    } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const saveEditBlock = async () => {
    if (!editBlock) return;
    try {
      await api(`/blocks/${editBlock.id}`, token, { method: "PUT", body: { blockNumber: editBlock.blockNumber, name: editBlock.name, locality: editBlock.locality, county: editBlock.county, sirutaCode: editBlock.sirutaCode } });
      onRefresh();
      setEditBlock(null);
    } catch (e) { console.error(e); }
  };

  const saveEditParcel = async () => {
    if (!editParcel) return;
    try {
      await api(`/parcels/${editParcel.id}`, token, { method: "PUT", body: { parcelNumber: editParcel.parcelNumber, areaHa: editParcel.areaHa, landCategory: editParcel.landCategory } });
      onRefresh();
      setEditParcel(null);
    } catch (e) { console.error(e); }
  };

  const allParcels = useMemo(() => blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber, blockId: b.id, locality: b.locality }))), [blocks]);

  return (
    <>
      {deleteTarget && <ConfirmDelete message={`Sigur doriti sa stergeti ${deleteTarget.type === "blocks" ? "blocul" : "parcela"}? Aceasta actiune este ireversibila.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {editBlock && (
        <Card title="Editare Bloc Fizic" style={{ border: `2px solid ${C.wheat}` }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Nr. Bloc" value={editBlock.blockNumber} onChange={(e) => setEditBlock({ ...editBlock, blockNumber: e.target.value })} />
            <Input label="Nume" value={editBlock.name || ""} onChange={(e) => setEditBlock({ ...editBlock, name: e.target.value })} />
            <Input label="Localitate" value={editBlock.locality || ""} onChange={(e) => setEditBlock({ ...editBlock, locality: e.target.value })} />
            <Input label="Judet" value={editBlock.county || ""} onChange={(e) => setEditBlock({ ...editBlock, county: e.target.value })} />
            <Btn onClick={saveEditBlock}>Salveaza</Btn>
            <Btn variant="secondary" onClick={() => setEditBlock(null)}>Anuleaza</Btn>
          </div>
        </Card>
      )}

      {editParcel && (
        <Card title="Editare Parcela" style={{ border: `2px solid ${C.wheat}` }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Nr. Parcela" type="number" value={editParcel.parcelNumber} onChange={(e) => setEditParcel({ ...editParcel, parcelNumber: Number(e.target.value) })} />
            <Input label="Suprafata (ha)" type="number" step="0.01" value={editParcel.areaHa} onChange={(e) => setEditParcel({ ...editParcel, areaHa: Number(e.target.value) })} />
            <Select label="Categorie" value={editParcel.landCategory} onChange={(e) => setEditParcel({ ...editParcel, landCategory: e.target.value })} options={[{ value: "TA", label: "TA (Arabil)" }, { value: "PP", label: "PP (Pasune)" }, { value: "VI", label: "VI (Vie)" }, { value: "LV", label: "LV (Livada)" }]} />
            <Btn onClick={saveEditParcel}>Salveaza</Btn>
            <Btn variant="secondary" onClick={() => setEditParcel(null)}>Anuleaza</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card title="Adauga Bloc Fizic">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Nr. Bloc" value={blockNr} onChange={(e) => setBlockNr(e.target.value)} style={{ width: 80 }} />
            <Input label="Nume (optional)" value={blockName} onChange={(e) => setBlockName(e.target.value)} />
            <Input label="Localitate" value={blocLoc} onChange={(e) => setBlocLoc(e.target.value)} />
            <Input label="Judet" value={blocCounty} onChange={(e) => setBlocCounty(e.target.value)} />
            <Input label="SIRUTA" value={sirutaCode} onChange={(e) => setSirutaCode(e.target.value)} style={{ width: 100 }} />
            <Btn onClick={addBlock} disabled={loading}>Adauga bloc</Btn>
          </div>
        </Card>
        <Card title="Adauga Parcela">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Select label="Alege Bloc" value={selBlock} onChange={(e) => setSelBlock(e.target.value)} options={blocks.map((b) => ({ value: b.id, label: `Bloc ${b.blockNumber}` }))} />
            <Input label="Nr. Parcela" type="number" value={parcelNr} onChange={(e) => setParcelNr(e.target.value)} style={{ width: 90 }} />
            <Input label="Suprafata (ha)" type="number" step="0.01" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: 110 }} />
            <Select label="Categorie" value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: "TA", label: "TA (Arabil)" }, { value: "PP", label: "PP (Pasune)" }, { value: "VI", label: "VI (Vie)" }, { value: "LV", label: "LV (Livada)" }]} />
            <Btn onClick={addParcel} disabled={loading}>Adauga parcela</Btn>
          </div>
        </Card>
      </div>

      <Card title="Blocuri Fizice">
        <Table
          headers={["Nr. Bloc", "Nume", "Localitate", "Judet", "Nr. Parcele", "Actiuni"]}
          rows={blocks.map((b) => [
            b.blockNumber, b.name || "-", b.locality || "-", b.county || "-", (b.parcele || []).length,
            <div style={{ display: "flex", gap: 4 }}>
              <Btn variant="small" onClick={() => setEditBlock(b)}>Editeaza</Btn>
              <Btn variant="smallDanger" onClick={() => setDeleteTarget({ type: "blocks", id: b.id })}>Sterge</Btn>
            </div>
          ])}
        />
      </Card>

      <Card title="Registru Parcele" actions={<Btn variant="secondary" onClick={() => exportCSV(["Bloc Fizic", "Nr Parcela", "Suprafata (ha)", "Categorie", "Localitate"], allParcels.map((p) => [p.blockNumber, p.parcelNumber, p.areaHa, p.landCategory, p.locality]), "parcele.csv")}>Exporta CSV</Btn>}>
        <Table
          headers={["Bloc Fizic", "Parcela", "Suprafata (ha)", "Categorie", "Localitate", "Actiuni"]}
          rows={allParcels.map((p) => [
            p.blockNumber, p.parcelNumber, p.areaHa, p.landCategory, p.locality || "-",
            <div style={{ display: "flex", gap: 4 }}>
              <Btn variant="small" onClick={() => setEditParcel(p)}>Editeaza</Btn>
              <Btn variant="smallDanger" onClick={() => setDeleteTarget({ type: "parcels", id: p.id })}>Sterge</Btn>
            </div>
          ])}
        />
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 2: CULTURI & ROTAȚIE
// ─────────────────────────────────────────────
function TabCulturi({ token, blocks, crops, seasons, onRefresh }) {
  const [selParcel, setSelParcel] = useState("");
  const [selCrop, setSelCrop] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState("Toamna");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const parcels = useMemo(() => blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber }))), [blocks]);

  const checkRotation = (pid, cid, yr) => seasons.some((s) => s.parcelId === Number(pid) && s.cropId === Number(cid) && s.year === Number(yr) - 1);

  const assign = async () => {
    if (!selParcel || !selCrop) return;
    setLoading(true);
    try {
      const warn = checkRotation(selParcel, selCrop, year);
      await api("/seasons", token, { method: "POST", body: { parcelId: Number(selParcel), cropId: Number(selCrop), year: Number(year), season, rotationWarning: warn } });
      onRefresh();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/seasons/${deleteTarget}`, token, { method: "DELETE" });
      onRefresh();
    } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const warnings = seasons.filter((s) => s.rotationWarning);

  return (
    <>
      {deleteTarget && <ConfirmDelete message="Sigur doriti sa stergeti aceasta alocare de cultura?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {warnings.length > 0 && <Warning>Atentie! {warnings.length} parcel(e) au aceeasi cultura ca anul precedent (rotatie nerespectata).</Warning>}
      <Card title="Alocare Cultura si Verificare Rotatie">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Select label="Parcela" value={selParcel} onChange={(e) => setSelParcel(e.target.value)} options={parcels.map((p) => ({ value: p.id, label: `B${p.blockNumber}/P${p.parcelNumber} (${p.areaHa} ha)` }))} />
          <Select label="Cultura" value={selCrop} onChange={(e) => setSelCrop(e.target.value)} options={crops.map((c) => ({ value: c.id, label: c.name }))} />
          <Input label="An Agricol" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 100 }} />
          <Select label="Sezon" value={season} onChange={(e) => setSeason(e.target.value)} options={[{ value: "Toamna", label: "Toamna" }, { value: "Primavara", label: "Primavara" }]} />
          <Btn onClick={assign} disabled={loading}>Aloca cultura</Btn>
        </div>
        {selParcel && selCrop && checkRotation(selParcel, selCrop, year) && <div style={{ marginTop: 12, color: C.danger, fontSize: 13, fontWeight: 600 }}>Aceeasi cultura a fost pe aceasta parcela anul trecut!</div>}
      </Card>
      <Card title="Istoric Culturi" actions={<Btn variant="secondary" onClick={() => exportCSV(["An", "Sezon", "Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Cultura", "Rotatie"], seasons.map((s) => [s.year, s.season, s.parcel?.block?.blockNumber, s.parcel?.parcelNumber, s.parcel?.areaHa, s.cultura?.name, s.rotationWarning ? "Nerespectata" : "OK"]), "istoric_culturi.csv")}>Exporta CSV</Btn>}>
        <Table
          headers={["An", "Sezon", "Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Cultura", "Rotatie", "Actiuni"]}
          rows={seasons.map((s) => [
            s.year, s.season, s.parcel?.block?.blockNumber, s.parcel?.parcelNumber, s.parcel?.areaHa, s.cultura?.name,
            s.rotationWarning ? <span style={{ color: C.danger, fontWeight: 600 }}>&#9888; Nerespectată</span> : <span style={{ color: C.forestLight }}>OK</span>,
            <Btn variant="smallDanger" onClick={() => setDeleteTarget(s.id)}>Sterge</Btn>
          ])}
        />
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 3: LUCRĂRI AGRICOLE
// ─────────────────────────────────────────────
function TabLucrari({ token, seasons, workTypes, works, onRefresh }) {
  const [selPs, setSelPs] = useState("");
  const [selWorkType, setSelWorkType] = useState("");
  const [period, setPeriod] = useState("");
  const [equip, setEquip] = useState("");
  const [products, setProducts] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterCrop, setFilterCrop] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const addWork = async () => {
    if (!selPs || !selWorkType) return;
    setLoading(true);
    try {
      await api("/works", token, { method: "POST", body: { parcelSeasonId: Number(selPs), workTypeId: Number(selWorkType), period, equipment: equip, products, qtyPerHa: Number(qty) || null, unit, notes } });
      onRefresh();
      setPeriod(""); setQty(""); setEquip(""); setProducts(""); setNotes("");
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api(`/works/${deleteTarget}`, token, { method: "DELETE" }); onRefresh(); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const uniqueCrops = [...new Set(works.map((w) => w.sezon?.cultura?.name).filter(Boolean))];
  const uniqueCats = [...new Set(workTypes.map((wt) => wt.category))];

  const filtered = works.filter((w) => {
    if (filterCrop && w.sezon?.cultura?.name !== filterCrop) return false;
    if (filterCat && w.tip?.category !== filterCat) return false;
    return true;
  });

  return (
    <>
      {deleteTarget && <ConfirmDelete message="Sigur doriti sa stergeti aceasta lucrare?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      <Card title="Inregistrare Lucrare Agricola">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Select label="Parcela-Sezon" value={selPs} onChange={(e) => setSelPs(e.target.value)} options={seasons.map((ps) => ({ value: ps.id, label: `B${ps.parcel?.block?.blockNumber}/P${ps.parcel?.parcelNumber} - ${ps.cultura?.name} (${ps.year})` }))} />
          <Select label="Tip Lucrare" value={selWorkType} onChange={(e) => setSelWorkType(e.target.value)} options={workTypes.map((wt) => ({ value: wt.id, label: `${wt.name} (${wt.category})` }))} />
          <Input label="Perioada" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ex: 15-20.09.2024" />
          <Input label="Utilaj" value={equip} onChange={(e) => setEquip(e.target.value)} placeholder="Ex: NH 5.95 + Plug" />
          <Input label="Produse" value={products} onChange={(e) => setProducts(e.target.value)} placeholder="Ex: Ingr. 20:20:13" />
          <Input label="Cant./ha" type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 80 }} />
          <Select label="Unitate" value={unit} onChange={(e) => setUnit(e.target.value)} options={[{ value: "kg", label: "kg" }, { value: "l", label: "litri" }, { value: "ore", label: "ore" }]} />
          <Input label="Observatii" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          <Btn onClick={addWork} disabled={loading}>Adauga lucrarea</Btn>
        </div>
      </Card>
      <Card title="Registru Centralizator Lucrari Agricole" actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)} options={uniqueCrops.map((c) => ({ value: c, label: c }))} style={{ fontSize: 12, padding: "4px 8px" }} />
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} options={uniqueCats.map((c) => ({ value: c, label: c }))} style={{ fontSize: 12, padding: "4px 8px" }} />
          <Btn variant="secondary" onClick={() => exportCSV(["Categorie", "Lucrare", "Perioada", "Cultură", "Suprafață (ha)", "Parcelă", "Utilaj", "Produse", "Cant./ha", "U.M."], filtered.map((w) => [w.tip?.category, w.tip?.name, w.period, w.sezon?.cultura?.name, w.sezon?.parcel?.areaHa, `B${w.sezon?.parcel?.block?.blockNumber}/P${w.sezon?.parcel?.parcelNumber}`, w.equipment, w.products, w.qtyPerHa, w.unit]), "lucrari.csv")}>Exporta CSV</Btn>
        </div>
      }>
        <Table
          headers={["Categorie", "Lucrare", "Perioada", "Cultură", "Suprafață", "Parcelă", "Utilaj", "Produse", "Cant./ha", "U.M.", "Acțiuni"]}
          rows={filtered.map((w) => [
            w.tip?.category, w.tip?.name, w.period, w.sezon?.cultura?.name, w.sezon?.parcel?.areaHa,
            `B${w.sezon?.parcel?.block?.blockNumber}/P${w.sezon?.parcel?.parcelNumber}`,
            w.equipment || "-",
            w.products || "-",
            w.qtyPerHa || "-",
            w.unit || "-",
            <Btn variant="smallDanger" onClick={() => setDeleteTarget(w.id)}>Sterge</Btn>
          ])}
        />
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 4: FIȘE TEHNOLOGICE
// ─────────────────────────────────────────────
function TabFiseTehnice({ farmId, token, crops, seasons }) {
  const [selCrop, setSelCrop] = useState("");
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = [...new Set(seasons.map((s) => s.year))].sort((a, b) => b - a);
  const availableCrops = [...new Set(seasons.map((s) => JSON.stringify({ id: s.cropId, name: s.cultura?.name })))].map((s) => JSON.parse(s)).filter((c) => c.name);

  const generate = async () => {
    if (!selCrop || !selYear) return;
    setLoading(true);
    try {
      const data = await api(`/works/tech-sheet/${farmId}/${selCrop}/${selYear}`, token);
      setSheet(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const exportSheet = () => {
    if (!sheet) return;
    const rows = [];
    rows.push(["FISA TEHNOLOGICA"]);
    rows.push([`Cultura: ${sheet.crop?.name || "-"}`]);
    rows.push([`An agricol: ${sheet.year}`]);
    rows.push([`Suprafata totala: ${sheet.totalArea} ha`]);
    rows.push([`Numar parcele: ${sheet.parcelCount}`]);
    rows.push([]);
    rows.push(["LUCRARI MECANICE"]);
    rows.push(["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]);
    sheet.mechanical.forEach((m) => rows.push([m.name, m.period, m.equipment, m.products, m.qtyPerHa, m.unit]));
    rows.push([]);
    rows.push(["LUCRARI MANUALE"]);
    rows.push(["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]);
    sheet.manual.forEach((m) => rows.push([m.name, m.period, m.equipment, m.products, m.qtyPerHa, m.unit]));
    rows.push([]);
    rows.push(["INPUT-URI"]);
    rows.push(["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]);
    sheet.inputs.forEach((inp) => rows.push([inp.name, inp.period, inp.equipment, inp.products || "", inp.qtyPerHa, inp.unit]));
    rows.push([]);
    rows.push(["MATERIALE CONSUMATE (DIN TOATE CATEGORIILE)"]);
    rows.push(["Produs", "Lucrare", "Cantitate Totala", "U.M.", "Cant./ha", "Perioada"]);
    (sheet.materials || []).forEach((m) => rows.push([m.product, m.workName || "", m.totalQty, m.unit, m.qtyPerHa, m.period]));
    exportCSV([], rows, `fisa_tehnologica_${sheet.crop?.name}_${sheet.year}.csv`);
  };

  return (
    <>
      <Card title="Generare Fisa Tehnologica">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Select label="Cultura" value={selCrop} onChange={(e) => setSelCrop(e.target.value)} options={availableCrops.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="An" value={selYear} onChange={(e) => setSelYear(e.target.value)} options={years.map((y) => ({ value: y, label: y }))} />
          <Btn onClick={generate} disabled={loading}>{loading ? "Se genereaza..." : "Genereaza Fisa Tehnologica"}</Btn>
        </div>
      </Card>

      {sheet && (
        <Card title={`Fisa Tehnologica consolidata pe cultura — ${sheet.crop?.name || "-"} (${sheet.year})`} actions={<Btn variant="secondary" onClick={exportSheet}>Exporta CSV</Btn>}>
          <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginBottom: 16, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14 }}>
            <span><strong>Cultură:</strong> {sheet.crop?.name}</span>
            <span><strong>An:</strong> {sheet.year}</span>
            <span><strong>Suprafață totală:</strong> {sheet.totalArea} ha</span>
            <span><strong>Nr. parcele:</strong> {sheet.parcelCount}</span>
          </div>

          <h4 style={{ fontSize: 14, color: C.forest, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Lucrari Mecanice</h4>
          <Table headers={["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]} rows={sheet.mechanical.map((m) => [m.name, m.period, m.equipment, m.products || "-", m.qtyPerHa || "-", m.unit || "-"])} />

          <h4 style={{ fontSize: 14, color: C.forest, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", marginTop: 20 }}>Lucrari Manuale</h4>
          <Table headers={["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]} rows={sheet.manual.map((m) => [m.name, m.period, m.equipment || "-", m.products || "-", m.qtyPerHa || "-", m.unit || "-"])} />

          <h4 style={{ fontSize: 14, color: C.forest, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", marginTop: 20 }}>Input-uri</h4>
          <Table headers={["Lucrare", "Perioada", "Utilaj", "Produse", "Cant./ha", "U.M."]} rows={sheet.inputs.map((inp) => [inp.name, inp.period, inp.equipment || "-", inp.products || "-", inp.qtyPerHa || "-", inp.unit || "-"])} />

          <h4 style={{ fontSize: 14, color: C.forest, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", marginTop: 20 }}>Materiale Consumate (din toate categoriile)</h4>
          <Table headers={["Produs", "Lucrare", "Cantitate Totala", "U.M.", "Cant./ha", "Perioada"]} rows={(sheet.materials || []).map((m) => [m.product, m.workName || "-", m.totalQty, m.unit, m.qtyPerHa, m.period])} />
        </Card>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 5: RECOLTARE (stil prima versiune)
// ─────────────────────────────────────────────
function TabRecoltare({ farmId, token, seasons, crops, harvests, onRefresh }) {
  const [selCropYear, setSelCropYear] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [totalQty, setTotalQty] = useState("");
  const [humidity, setHumidity] = useState("");
  const [destination, setDestination] = useState("");
  const [invoiceStart, setInvoiceStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [success, setSuccess] = useState("");

  const cropYearGroups = useMemo(() => {
    const groups = {};
    seasons.forEach((ps) => {
      const key = `${ps.cropId}-${ps.year}`;
      if (!groups[key]) groups[key] = { crop: ps.cultura, year: ps.year, parcels: [], totalArea: 0 };
      groups[key].parcels.push(ps);
      groups[key].totalArea += (ps.parcel?.areaHa || 0);
    });
    return groups;
  }, [seasons]);

  const createHarvest = async () => {
    if (!selCropYear || !harvestDate || !totalQty) return;
    const group = cropYearGroups[selCropYear];
    if (!group) return;
    setLoading(true);
    try {
      await api("/harvests/proportional", token, {
        method: "POST",
        body: {
          farmId,
          cropId: group.crop.id,
          year: group.year,
          totalQuantityKg: Number(totalQty),
          harvestDate,
          humidity: Number(humidity) || null,
          avizNumber: invoiceStart,
          destination,
        },
      });
      onRefresh();
      setTotalQty(""); setHumidity(""); setDestination(""); setInvoiceStart("");
      setSuccess("Recoltare înregistrată cu succes!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api(`/harvests/${deleteTarget}`, token, { method: "DELETE" }); onRefresh(); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const sessions = useMemo(() => {
    const groups = {};
    harvests.forEach((h) => {
      const key = `${h.sezon?.cultura?.id}_${h.harvestDate}_${h.destination}`;
      if (!groups[key]) groups[key] = { id: key, crop: h.sezon?.cultura, date: h.harvestDate, entries: [], totalQty: 0, totalArea: 0 };
      groups[key].entries.push(h);
      groups[key].totalQty += h.quantityKg;
      groups[key].totalArea += (h.sezon?.parcel?.areaHa || 0);
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [harvests]);

  return (
    <>
      {deleteTarget && <ConfirmDelete message="Sigur doriti sa stergeti aceasta recoltare?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {success && <SuccessMsg>{success}</SuccessMsg>}

      <Card title="Înregistrare recoltare (calcul proporțional automat)">
        <p style={{ fontSize: 13, color: C.textMuted, marginTop: 0, marginBottom: 16 }}>
          Introdu cantitatea totală recoltată la nivel de cultură. Distribuția pe parcele se calculează automat:
          <br /><strong style={{ color: C.forest }}>Cantitate parcelă = (Total kg ÷ Total ha cultură) × Suprafață parcelă</strong>
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Select label="Cultură / An" value={selCropYear} onChange={e => setSelCropYear(e.target.value)}
            options={Object.entries(cropYearGroups).map(([key, g]) => ({
              value: key, label: `${g.crop?.name} — ${g.year} (${g.totalArea.toFixed(2)} ha)`
            }))} />
          <Input label="Data recoltării" type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} style={{ width: 150 }} />
          <Input label="Cantitate TOTALĂ (kg)" type="number" value={totalQty} onChange={e => setTotalQty(e.target.value)} placeholder="Ex: 71215" style={{ width: 150 }} />
          <Input label="Umiditate (%)" type="number" value={humidity} onChange={e => setHumidity(e.target.value)} placeholder="Ex: 14" style={{ width: 100 }} />
          <Input label="Destinație" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex: Ameropa" style={{ width: 130 }} />
          <Input label="Nr. aviz (start)" value={invoiceStart} onChange={e => setInvoiceStart(e.target.value)} placeholder="Ex: 21" style={{ width: 100 }} />
          <Btn onClick={createHarvest} disabled={!selCropYear || !harvestDate || !totalQty || loading}>Înregistrează</Btn>
        </div>
      </Card>

      {sessions.map(session => (
        <Card key={session.id} title={`Jurnal recoltare — ${session.crop?.name} — ${session.date}`}
          actions={<Btn variant="secondary" onClick={() => exportCSV(
            ["Nr.crt", "Data", "Produs", "Sola", "Suprafață (ha)", "Cantitate (kg)", "Nr. Aviz", "Umiditate %", "Destinație"],
            session.entries.map((e, i) => [i + 1, session.date, session.crop?.name, `B${e.sezon?.parcel?.block?.blockNumber}/P${e.sezon?.parcel?.parcelNumber}`, e.sezon?.parcel?.areaHa, e.quantityKg, e.avizNumber || "", e.humidity || "", e.destination]),
            `jurnal_recoltare_${session.crop?.name}_${session.date}.csv`
          )} style={{ fontSize: 12, padding: "4px 12px" }}>Exportă CSV</Btn>}>
          <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 20, fontSize: 13, flexWrap: "wrap" }}>
            <span><strong>Total cantitate:</strong> {session.totalQty.toLocaleString()} kg</span>
            <span><strong>Total suprafață:</strong> {session.totalArea.toFixed(2)} ha</span>
            <span><strong>Randament mediu:</strong> {session.totalArea > 0 ? (session.totalQty / session.totalArea).toFixed(0) : 0} kg/ha</span>
          </div>
          <Table headers={["Nr.", "Produs", "Sola", "Suprafață (ha)", "Cantitate (kg)", "Nr. Aviz", "Umiditate %", "Destinație", "Acțiuni"]}
            rows={session.entries.map((e, i) => [
              i + 1, session.crop?.name, `B${e.sezon?.parcel?.block?.blockNumber}/P${e.sezon?.parcel?.parcelNumber}`, e.sezon?.parcel?.areaHa, e.quantityKg.toLocaleString(), e.avizNumber || "—", e.humidity || "—", e.destination || "—",
              <Btn variant="smallDanger" onClick={() => setDeleteTarget(e.id)}>Sterge</Btn>
            ])} />
        </Card>
      ))}
    </>
  );
}


// ─────────────────────────────────────────────
// TAB 6: RAPOARTE APIA (stil prima versiune)
// ─────────────────────────────────────────────
function TabRapoarteApia({ farmId, token }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await api(`/reports/apia/${farmId}/${year}`, token);
      setReport(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const exportReport = () => {
    if (!report) return;
    const headers = ["Nr.Crt", "Judet", "Localitate", "Nr. Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Categorie", "Cultura", "An", "Sezon", "Interventie DR", "Cod Pachet"];
    const rows = report.rows.map((r) => [r.nrCrt, r.judet, r.localitate, r.blocFizic, r.parcela, r.suprafata, r.landCategory, r.cultura, r.year, r.season, r.drIntervention, r.codPachet]);
    exportCSV(headers, rows, `raport_apia_${year}.csv`);
  };

  return (
    <>
      <Card title="Generare Raport APIA (Cerere de Plată)">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Input label="An agricol" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 120 }} />
          <Btn onClick={generate} disabled={loading}>{loading ? "Se genereaza..." : "Genereaza Raport APIA"}</Btn>
        </div>
      </Card>

      {report && (
        <>
          <h3 style={{ fontSize: 18, color: C.earth, marginBottom: 16, marginTop: 24 }}>1. Informații Fermă</h3>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Denumire exploatatie</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.name}</div>
              </div>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>CUI / Cod fiscal</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.cui || "-"}</div>
              </div>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Judet</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.county || "-"}</div>
              </div>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Localitate</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.locality || "-"}</div>
              </div>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>IBAN</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.iban || "-"}</div>
              </div>
              <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Banca</div>
                <div style={{ fontWeight: 600, color: C.earth }}>{report.farm.bank || "-"}</div>
              </div>
            </div>
          </Card>

          <h3 style={{ fontSize: 18, color: C.earth, marginTop: 32, marginBottom: 16 }}>2. GAEC 7 — Diversificarea Culturilor</h3>
          <Card style={{ border: `2px solid ${report.gaec7.isCompliant ? C.success : C.danger}` }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <StatBox label="Suprafata totala (ha)" value={report.gaec7.totalArea} color={C.forest} />
              <StatBox label="Cultura principala (%)" value={`${report.gaec7.mainCropPct}%`} color={report.gaec7.mainCropPct > 75 && !report.gaec7.isExempt ? C.danger : C.success} />
              <StatBox label="Nr. culturi (gen)" value={report.gaec7.crops.length} color={C.soil} />
              <StatBox label="Status" value={report.gaec7.isExempt ? "Exceptat (<10 ha)" : report.gaec7.isCompliant ? "CONFORM" : "NECONFORM"} color={report.gaec7.isCompliant || report.gaec7.isExempt ? C.success : C.danger} />
            </div>
            {report.gaec7.isExempt && (
              <div style={{ padding: "10px 14px", background: "#e8f5e9", borderRadius: 8, fontSize: 13, color: C.success, marginBottom: 12 }}>
                Exploatatia este exceptata de la GAEC 7 (suprafata sub 10 ha).
              </div>
            )}
            {!report.gaec7.isExempt && !report.gaec7.isCompliant && (
              <Warning>Cultura principala ({report.gaec7.crops[0]?.name}) depaseste 75% din suprafata totala! ({report.gaec7.mainCropPct}%)</Warning>
            )}
            <Table
              headers={["Cultura", "Gen botanic", "Suprafata (ha)", "Pondere (%)"]}
              rows={report.gaec7.crops.map((c) => [c.name, c.genus, c.area, `${c.percentage}%`])}
            />
          </Card>

          <h3 style={{ fontSize: 18, color: C.earth, marginTop: 32, marginBottom: 16 }}>3. Declarație de suprafață — Format APIA</h3>
          <Card actions={<Btn variant="secondary" onClick={exportReport}>Exporta CSV (format APIA)</Btn>}>
            <Table
              headers={["Nr.Crt", "Judet", "Localitate", "Nr. Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Categorie", "Cultura", "An", "Sezon", "Interventie DR", "Cod Pachet"]}
              rows={report.rows.map((r) => [r.nrCrt, r.judet, r.localitate, r.blocFizic, r.parcela, r.suprafata, r.landCategory, r.cultura, r.year, r.season, r.drIntervention || "-", r.codPachet])}
            />

            <div style={{ marginTop: 16, padding: "12px 16px", background: C.bg, borderRadius: 8, display: "flex", gap: 24, fontSize: 13, fontWeight: 600 }}>
              <span>Total suprafata: {report.totals.suprafata} ha</span>
              <span>Nr. parcele: {report.totals.nrParcele}</span>
              <span>Nr. culturi: {report.totals.nrCulturi}</span>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 7: MOTORINĂ (stil prima versiune)
// ─────────────────────────────────────────────
function TabMotorina({ farmId, token, seasons, fuelEntries, onRefresh }) {
  const [type, setType] = useState("ACHIZITIE");
  const [date, setDate] = useState("");
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");
  const [invoice, setInvoice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [equip, setEquip] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [selPs, setSelPs] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalPurchased = fuelEntries.filter(e => e.type === "ACHIZITIE").reduce((s, e) => s + e.liters, 0);
  const totalConsumed = fuelEntries.filter(e => e.type === "CONSUM").reduce((s, e) => s + e.liters, 0);
  const stock = totalPurchased - totalConsumed;

  const addEntry = async () => {
    if (!date || !liters) return;
    setLoading(true);
    try {
      const body = {
        farmId, type, date, liters: Number(liters), notes,
        pricePerLiter: type === "ACHIZITIE" ? Number(price) || null : null,
        invoiceNumber: type === "ACHIZITIE" ? invoice : null,
        supplier: type === "ACHIZITIE" ? supplier : null,
        equipment: type === "CONSUM" ? equip : null,
        workDescription: type === "CONSUM" ? workDesc : null,
        parcelSeasonId: type === "CONSUM" && selPs ? Number(selPs) : null
      };
      await api("/fuel", token, { method: "POST", body });
      onRefresh();
      setLiters(""); setPrice(""); setInvoice(""); setSupplier(""); setEquip(""); setWorkDesc(""); setNotes(""); setDate(""); setSelPs("");
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api(`/fuel/${deleteTarget}`, token, { method: "DELETE" }); onRefresh(); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  return (
    <>
      {deleteTarget && <ConfirmDelete message="Sigur doriți să ștergeți această înregistrare?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <StatBox label="Total Achiziționată (L)" value={totalPurchased.toLocaleString()} color={C.forest} />
        <StatBox label="Total Consumată (L)" value={totalConsumed.toLocaleString()} color={C.warn} />
        <StatBox label="Stoc Actual (L)" value={stock.toLocaleString()} color={stock < 0 ? C.danger : C.forestLight} />
      </div>

      <Card title="Adaugă Înregistrare Motorină">
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Btn variant={type === "ACHIZITIE" ? "primary" : "secondary"} onClick={() => setType("ACHIZITIE")}>Achiziție</Btn>
          <Btn variant={type === "CONSUM" ? "primary" : "secondary"} onClick={() => setType("CONSUM")}>Consum</Btn>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 150 }} />
          <Input label="Litri" type="number" value={liters} onChange={e => setLiters(e.target.value)} style={{ width: 100 }} />
          {type === "ACHIZITIE" ? (
            <>
              <Input label="Preț/litru" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 100 }} />
              <Input label="Nr. Factură" value={invoice} onChange={e => setInvoice(e.target.value)} style={{ width: 120 }} />
              <Input label="Furnizor" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Ex: Petrom" style={{ width: 150 }} />
            </>
          ) : (
            <>
              <Input label="Utilaj" value={equip} onChange={e => setEquip(e.target.value)} placeholder="Ex: NH 5.95" style={{ width: 150 }} />
              <Input label="Lucrare" value={workDesc} onChange={e => setWorkDesc(e.target.value)} placeholder="Ex: Arat" style={{ width: 150 }} />
              <Select label="Parcelă" value={selPs} onChange={e => setSelPs(e.target.value)}
                options={seasons.map(ps => ({ value: ps.id, label: `B${ps.parcel?.block?.blockNumber}/P${ps.parcel?.parcelNumber} (${ps.cultura?.name})` }))} />
            </>
          )}
          <Input label="Note" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opțional" />
          <Btn onClick={addEntry} disabled={!date || !liters || loading}>Adaugă</Btn>
        </div>
      </Card>

      <Card title="Jurnal Gestiune Motorină" actions={<Btn variant="secondary" onClick={() => exportCSV(["Tip", "Data", "Litri", "Preț/L", "Factură/Utilaj", "Furnizor/Lucrare", "Note"], fuelEntries.map(e => [e.type, e.date, e.liters, e.pricePerLiter || "", e.invoiceNumber || e.equipment || "", e.supplier || e.workDescription || "", e.notes || ""]), "jurnal_motorina.csv")}>Exportă CSV</Btn>}>
        <Table headers={["Tip", "Data", "Litri", "Detalii", "Note", "Acțiuni"]}
          rows={fuelEntries.map(e => [
            <span style={{ color: e.type === "ACHIZITIE" ? C.forest : C.warn, fontWeight: 600, textTransform: "capitalize" }}>{e.type.toLowerCase()}</span>,
            e.date, e.liters.toLocaleString(),
            e.type === "ACHIZITIE"
              ? `${e.supplier || ""} (Fact. ${e.invoiceNumber || ""})`
              : `${e.equipment || ""} — ${e.workDescription || ""}`,
            e.notes || "—",
            <Btn variant="smallDanger" onClick={() => setDeleteTarget(e.id)}>Șterge</Btn>
          ])} />
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [works, setWorks] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [tab, setTab] = useState(0);

  const fetchFarms = useCallback(async (t) => {
    try {
      const res = await fetch(`${API_URL}/farms`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
        if (data.length > 0 && !activeFarm) setActiveFarm(data[0].id);
      }
    } catch (e) { console.error(e); }
  }, [activeFarm]);

  const fetchData = useCallback(async () => {
    if (!activeFarm || !token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [bRes, cRes, sRes, wtRes, wRes, hRes, fRes] = await Promise.all([
        fetch(`${API_URL}/blocks/farm/${activeFarm}`, { headers: h }),
        fetch(`${API_URL}/crops`, { headers: h }),
        fetch(`${API_URL}/seasons/farm/${activeFarm}`, { headers: h }),
        fetch(`${API_URL}/works/types`, { headers: h }),
        fetch(`${API_URL}/works/farm/${activeFarm}`, { headers: h }),
        fetch(`${API_URL}/harvests/farm/${activeFarm}`, { headers: h }),
        fetch(`${API_URL}/fuel/farm/${activeFarm}`, { headers: h }),
      ]);
      if (bRes.ok) setBlocks(await bRes.json());
      if (cRes.ok) setCrops(await cRes.json());
      if (sRes.ok) setSeasons(await sRes.json());
      if (wtRes.ok) setWorkTypes(await wtRes.json());
      if (wRes.ok) setWorks(await wRes.json());
      if (hRes.ok) setHarvests(await hRes.json());
      if (fRes.ok) setFuelEntries(await fRes.json());
    } catch (e) { console.error(e); }
  }, [activeFarm, token]);

  useEffect(() => {
    const u = localStorage.getItem("agrosistem_user");
    const t = localStorage.getItem("agrosistem_token");
    if (u && t) {
      setUser(JSON.parse(u));
      setToken(t);
      fetchFarms(t);
    }
  }, [fetchFarms]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const login = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("agrosistem_user", JSON.stringify(u));
    localStorage.setItem("agrosistem_token", t);
    fetchFarms(t);
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!user) return <AuthScreen onLogin={login} />;

  const tabs = ["Dashboard", "Terenuri", "Culturi", "Lucrari", "Fise Tehnice", "Recoltare", "Rapoarte APIA", "Motorina"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ background: `linear-gradient(135deg, ${C.earth} 0%, ${C.forest} 100%)`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: C.wheat, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.earth }}>A</div>
          <span style={{ color: C.cream, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>AgroSistem</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {farms.length > 0 && (
            <select value={activeFarm || ""} onChange={(e) => setActiveFarm(Number(e.target.value))} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.wheatLight}`, background: "rgba(255,255,255,0.1)", color: C.cream, fontSize: 14, cursor: "pointer" }}>
              {farms.map((f) => <option key={f.id} value={f.id} style={{ color: C.text }}>{f.name}</option>)}
            </select>
          )}
          <span style={{ color: C.wheatLight, fontSize: 13, fontWeight: 500 }}>{user.name}</span>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: C.white, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Iesire</button>
        </div>
      </header>

      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: "14px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: tab === i ? 600 : 400, color: tab === i ? C.forest : C.textMuted, borderBottom: tab === i ? `3px solid ${C.forest}` : "none", whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </nav>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {!activeFarm ? (
          <FarmSetup token={token} onCreated={(id) => { fetchFarms(token); setActiveFarm(id); }} />
        ) : (
          <>
            {tab === 0 && <TabDashboard blocks={blocks} seasons={seasons} harvests={harvests} works={works} />}
            {tab === 1 && <TabTerenuri farmId={activeFarm} token={token} blocks={blocks} seasons={seasons} onRefresh={fetchData} />}
            {tab === 2 && <TabCulturi token={token} blocks={blocks} crops={crops} seasons={seasons} onRefresh={fetchData} />}
            {tab === 3 && <TabLucrari token={token} seasons={seasons} workTypes={workTypes} works={works} onRefresh={fetchData} />}
            {tab === 4 && <TabFiseTehnice farmId={activeFarm} token={token} crops={crops} seasons={seasons} />}
            {tab === 5 && <TabRecoltare farmId={activeFarm} token={token} seasons={seasons} crops={crops} harvests={harvests} onRefresh={fetchData} />}
            {tab === 6 && <TabRapoarteApia farmId={activeFarm} token={token} />}
            {tab === 7 && <TabMotorina farmId={activeFarm} token={token} seasons={seasons} fuelEntries={fuelEntries} onRefresh={fetchData} />}
          </>
        )}
      </main>
    </div>
  );
}
