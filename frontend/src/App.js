import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";

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
// SORTARE NATURALA (suporta litere: 1, 2a, 10b)
// ─────────────────────────────────────────────
function naturalSort(a, b) {
  return String(a).localeCompare(String(b), "ro", { numeric: true });
}

// ─────────────────────────────────────────────
// ANTET FERMA PENTRU EXCEL
// ─────────────────────────────────────────────
function farmHeaderRows(farm, title) {
  return [
    ["Denumire ferma:", farm?.name || ""],
    ["Nr. Registrul Comertului:", farm?.registerNumber || ""],
    ["Cod fiscal (CUI):", farm?.cui || ""],
    ["Sediu:", [farm?.locality, farm?.county].filter(Boolean).join(", ")],
    [],
    [title],
  ];
}

// ─────────────────────────────────────────────
// EXPORT EXCEL (XLSX)
// ─────────────────────────────────────────────
function exportExcel(headers, rows, filename, sheetName = "Date", farm = null, title = "") {
  const prefix = farm ? farmHeaderRows(farm, title) : [];
  const data = [...prefix, headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Auto-width columns (based on headers + data only)
  ws["!cols"] = headers.map((h, i) => {
    let max = String(h).length;
    rows.forEach((r) => { const len = String(r[i] == null ? "" : r[i]).length; if (len > max) max = len; });
    return { wch: Math.min(max + 2, 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function exportExcelMultiHeader(headerRows, dataRows, filename, sheetName = "Date", merges = [], farm = null, title = "") {
  const prefix = farm ? farmHeaderRows(farm, title) : [];
  const prefixLen = prefix.length;
  const data = [...prefix, ...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Shift merges to account for prefix rows
  if (merges.length > 0) ws["!merges"] = merges.map((m) => ({
    s: { r: m.s.r + prefixLen, c: m.s.c },
    e: { r: m.e.r + prefixLen, c: m.e.c },
  }));
  // Auto-width based on last header row and data
  const lastHeader = headerRows[headerRows.length - 1] || [];
  ws["!cols"] = lastHeader.map((h, i) => {
    let max = String(h || "").length;
    dataRows.forEach((r) => { const len = String(r[i] == null ? "" : r[i]).length; if (len > max) max = len; });
    return { wch: Math.min(max + 2, 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
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
function ParcelMap({ blocks, seasons, onParcelClick }) {
  const parcels = blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber })));
  const maxArea = Math.max(...parcels.map((p) => p.areaHa), 1);
  const colors = ["#2d6a4f", "#6b4423", "#dda15e", "#e36414", "#264653", "#e76f51", "#606c38", "#8d6346"];

  return (
    <div style={{ overflowX: "auto" }}>
      {onParcelClick && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Click pe o parcelă pentru a vedea istoricul culturilor.</div>}
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
                  <g key={p.id} onClick={() => onParcelClick && onParcelClick(p)} style={{ cursor: onParcelClick ? "pointer" : "default" }}>
                    <rect x={bx + 10} y={y} width={150} height={h} rx={4} fill={col + "44"} stroke={col} strokeWidth={0.8} />
                    <rect x={bx + 10} y={y} width={150} height={h} rx={4} fill="transparent" stroke={col} strokeWidth={onParcelClick ? 0 : 0}
                      onMouseEnter={e => { if (onParcelClick) e.currentTarget.setAttribute("fill", col + "22"); }}
                      onMouseLeave={e => { if (onParcelClick) e.currentTarget.setAttribute("fill", "transparent"); }} />
                    <text x={bx + 18} y={y + h / 2 + 1} fontSize={10} fill={col} dominantBaseline="central" style={{ pointerEvents: "none" }}>P{p.parcelNumber} — {p.areaHa} ha</text>
                    {ps?.cultura && <text x={bx + 152} y={y + h / 2 + 1} fontSize={9} fill="#555" dominantBaseline="central" textAnchor="end" style={{ pointerEvents: "none" }}>{ps.cultura.name.substring(0, 12)}</text>}
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
// MODAL: ISTORIC CULTURI PARCELA
// ─────────────────────────────────────────────
function ParcelHistoryModal({ parcel, seasons, onClose }) {
  const hist = seasons
    .filter((s) => s.parcelId === parcel.id)
    .sort((a, b) => b.year - a.year || a.season.localeCompare(b.season));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 14, padding: 28, width: 540, maxWidth: "95vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.earth }}>
              Istoric culturi — B{parcel.blockNumber}/P{parcel.parcelNumber}
            </h3>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              {parcel.areaHa} ha · {parcel.landCategory} · {parcel.locality || ""}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textMuted, lineHeight: 1 }}>✕</button>
        </div>
        {hist.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: C.textMuted, fontSize: 14 }}>Nu exista culturi inregistrate pentru aceasta parcela.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["An", "Sezon", "Cultura", "Rotatie"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.forest, background: C.sky, borderBottom: `2px solid ${C.forestLight}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? C.bgCard : C.bg }}>
                  <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, color: C.earth }}>{s.year}</td>
                  <td style={{ padding: "8px 10px", fontSize: 13, color: C.textMuted }}>{s.season}</td>
                  <td style={{ padding: "8px 10px", fontSize: 13 }}>{s.cultura?.name || "—"}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12 }}>
                    {s.rotationWarning
                      ? <span style={{ color: C.danger, fontWeight: 600 }}>⚠ Nerespectată</span>
                      : <span style={{ color: C.forestLight }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Btn variant="secondary" onClick={onClose}>Inchide</Btn>
        </div>
      </div>
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
          <img src="/tractor-icon.jpg" alt="AgroSistem" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }} />
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
  const [registerNumber, setRegisterNumber] = useState("");
  const [loc, setLoc] = useState("");
  const [county, setCounty] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const data = await api("/farms", token, { method: "POST", body: { name, cui, registerNumber, locality: loc, county, iban, bank } });
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
        <Input label="Nr. Registrul Comertului" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} placeholder="ex: J01/123/2020" />
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
// EDITARE FERMA
// ─────────────────────────────────────────────
function FarmEdit({ token, farm, onSaved, onCancel }) {
  const [name, setName] = useState(farm?.name || "");
  const [cui, setCui] = useState(farm?.cui || "");
  const [registerNumber, setRegisterNumber] = useState(farm?.registerNumber || "");
  const [loc, setLoc] = useState(farm?.locality || "");
  const [county, setCounty] = useState(farm?.county || "");
  const [iban, setIban] = useState(farm?.iban || "");
  const [bank, setBank] = useState(farm?.bank || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const data = await api(`/farms/${farm.id}`, token, { method: "PUT", body: { name, cui, registerNumber, locality: loc, county, iban, bank } });
      onSaved(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, borderRadius: 14, padding: 32, width: 560, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.earth }}>Editare date ferma</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Denumire ferma / exploatatie" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="CUI / Cod fiscal" value={cui} onChange={(e) => setCui(e.target.value)} />
          <Input label="Nr. Registrul Comertului" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} placeholder="ex: J01/123/2020" />
          <Input label="Localitate (sediu)" value={loc} onChange={(e) => setLoc(e.target.value)} />
          <Input label="Judet" value={county} onChange={(e) => setCounty(e.target.value)} />
          <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
          <Input label="Banca" value={bank} onChange={(e) => setBank(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn onClick={save} disabled={!name || loading}>Salveaza</Btn>
          <Btn variant="secondary" onClick={onCancel}>Anuleaza</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB 0: DASHBOARD
// ─────────────────────────────────────────────
function TabDashboard({ blocks, seasons, harvests, works }) {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const allParcels = blocks.flatMap((b) => b.parcele || []);
  const totalArea = allParcels.reduce((s, p) => s + p.areaHa, 0);
  const currentYear = new Date().getFullYear();
  const currentSeasons = seasons.filter((s) => s.year === currentYear);
  const uniqueCrops = [...new Set(currentSeasons.map((s) => s.cultura?.name).filter(Boolean))];

  return (
    <>
      {selectedParcel && <ParcelHistoryModal parcel={selectedParcel} seasons={seasons} onClose={() => setSelectedParcel(null)} />}
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
      {blocks.length > 0 && <Card title="Harta exploatatie (SVG)"><ParcelMap blocks={blocks} seasons={seasons} onParcelClick={(p) => setSelectedParcel({ ...p, blockNumber: blocks.find(b => b.id === p.blockId)?.blockNumber })} /></Card>}
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 1: TERENURI
// ─────────────────────────────────────────────
function TabTerenuri({ farmId, token, blocks, seasons, farm, onRefresh }) {
  const [selectedParcel, setSelectedParcel] = useState(null); // pentru modal istoric culturi
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
      await api("/parcels", token, { method: "POST", body: { blockId: Number(selBlock), parcelNumber: parcelNr, areaHa: Number(area), landCategory: cat } });
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

  const allParcels = useMemo(() => blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber, blockId: b.id, locality: b.locality }))).sort((a, b) => {
    const bn = naturalSort(a.blockNumber, b.blockNumber);
    return bn !== 0 ? bn : naturalSort(a.parcelNumber, b.parcelNumber);
  }), [blocks]);

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
            <Input label="Nr. Parcela" type="text" value={editParcel.parcelNumber} onChange={(e) => setEditParcel({ ...editParcel, parcelNumber: e.target.value })} placeholder="ex: 1, 2a, 10b" />
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
            <Input label="Nr. Parcela" type="text" value={parcelNr} onChange={(e) => setParcelNr(e.target.value)} style={{ width: 90 }} placeholder="ex: 1, 2a" />
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

      {selectedParcel && <ParcelHistoryModal parcel={selectedParcel} seasons={seasons} onClose={() => setSelectedParcel(null)} />}

      <Card title="Registru Parcele" actions={<Btn variant="secondary" onClick={() => exportExcel(["Bloc Fizic", "Nr Parcela", "Suprafata (ha)", "Categorie", "Localitate"], allParcels.map((p) => [p.blockNumber, p.parcelNumber, p.areaHa, p.landCategory, p.locality]), "parcele.xlsx", "Parcele", farm, "REGISTRUL PARCELELOR")}>Exporta Excel</Btn>}>
        <Table
          headers={["Bloc Fizic", "Parcela", "Suprafata (ha)", "Categorie", "Localitate", "Actiuni"]}
          rows={allParcels.map((p) => [
            p.blockNumber, p.parcelNumber, p.areaHa, p.landCategory, p.locality || "-",
            <div style={{ display: "flex", gap: 4 }}>
              <Btn variant="small" onClick={() => setSelectedParcel(p)}>Istoric</Btn>
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
function TabCulturi({ token, blocks, crops, seasons, farm, onRefresh }) {
  const [selParcel, setSelParcel] = useState("");
  const [selCrop, setSelCrop] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState("Toamna");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editSeason, setEditSeason] = useState(null); // { id, parcelId, cropId, year, season }

  const parcels = useMemo(() => blocks.flatMap((b) => (b.parcele || []).map((p) => ({ ...p, blockNumber: b.blockNumber }))).sort((a, b) => {
    const bn = naturalSort(a.blockNumber, b.blockNumber);
    return bn !== 0 ? bn : naturalSort(a.parcelNumber, b.parcelNumber);
  }), [blocks]);

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

  const handleUpdate = async () => {
    if (!editSeason) return;
    try {
      const warn = checkRotation(editSeason.parcelId, editSeason.cropId, editSeason.year);
      await api(`/seasons/${editSeason.id}`, token, { method: "PUT", body: { parcelId: editSeason.parcelId, cropId: Number(editSeason.cropId), year: Number(editSeason.year), season: editSeason.season, rotationWarning: warn } });
      setEditSeason(null);
      onRefresh();
    } catch (e) { console.error(e); }
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

  const sortedSeasons = [...seasons].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const bn = naturalSort(a.parcel?.block?.blockNumber, b.parcel?.block?.blockNumber);
    return bn !== 0 ? bn : naturalSort(a.parcel?.parcelNumber, b.parcel?.parcelNumber);
  });

  return (
    <>
      {deleteTarget && <ConfirmDelete message="Sigur doriti sa stergeti aceasta alocare de cultura?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {editSeason && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.bgCard, borderRadius: 14, padding: 28, width: 480, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: C.earth }}>Modificare cultura parcela</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Select label="Cultura" value={editSeason.cropId} onChange={(e) => setEditSeason({ ...editSeason, cropId: e.target.value })} options={crops.map((c) => ({ value: c.id, label: c.name }))} />
              <Input label="An Agricol" type="number" value={editSeason.year} onChange={(e) => setEditSeason({ ...editSeason, year: e.target.value })} style={{ width: 100 }} />
              <Select label="Sezon" value={editSeason.season} onChange={(e) => setEditSeason({ ...editSeason, season: e.target.value })} options={[{ value: "Toamna", label: "Toamna" }, { value: "Primavara", label: "Primavara" }]} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn onClick={handleUpdate}>Salveaza</Btn>
              <Btn variant="secondary" onClick={() => setEditSeason(null)}>Anuleaza</Btn>
            </div>
          </div>
        </div>
      )}
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
      <Card title="Istoric Culturi" actions={<Btn variant="secondary" onClick={() => exportExcel(["An", "Sezon", "Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Cultura", "Rotatie"], sortedSeasons.map((s) => [s.year, s.season, s.parcel?.block?.blockNumber, s.parcel?.parcelNumber, s.parcel?.areaHa, s.cultura?.name, s.rotationWarning ? "Nerespectata" : "OK"]), "istoric_culturi.xlsx", "Istoric Culturi", farm, "ISTORIC CULTURI")}>Exporta Excel</Btn>}>
        <Table
          headers={["An", "Sezon", "Bloc Fizic", "Nr. Parcela", "Suprafata (ha)", "Cultura", "Rotatie", "Actiuni"]}
          rows={sortedSeasons.map((s) => [
            s.year, s.season, s.parcel?.block?.blockNumber, s.parcel?.parcelNumber, s.parcel?.areaHa, s.cultura?.name,
            s.rotationWarning ? <span style={{ color: C.danger, fontWeight: 600 }}>&#9888; Nerespectată</span> : <span style={{ color: C.forestLight }}>OK</span>,
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="secondary" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => setEditSeason({ id: s.id, parcelId: s.parcelId, cropId: s.cropId, year: s.year, season: s.season })}>Editeaza</Btn>
              <Btn variant="smallDanger" onClick={() => setDeleteTarget(s.id)}>Sterge</Btn>
            </div>
          ])}
        />
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────
// TAB 3: LUCRĂRI AGRICOLE
// ─────────────────────────────────────────────
function TabLucrari({ token, seasons, workTypes, works, farm, onRefresh }) {
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
  }).sort((a, b) => {
    const yearDiff = (b.sezon?.year || 0) - (a.sezon?.year || 0);
    if (yearDiff !== 0) return yearDiff;
    const bn = naturalSort(a.sezon?.parcel?.block?.blockNumber, b.sezon?.parcel?.block?.blockNumber);
    return bn !== 0 ? bn : naturalSort(a.sezon?.parcel?.parcelNumber, b.sezon?.parcel?.parcelNumber);
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
          <Btn variant="secondary" onClick={() => exportExcel(["Categorie", "Lucrare", "Perioada", "Cultură", "Suprafață (ha)", "Parcelă", "Utilaj", "Produse", "Cant./ha", "U.M."], filtered.map((w) => [w.tip?.category, w.tip?.name, w.period, w.sezon?.cultura?.name, w.sezon?.parcel?.areaHa, `B${w.sezon?.parcel?.block?.blockNumber}/P${w.sezon?.parcel?.parcelNumber}`, w.equipment, w.products, w.qtyPerHa, w.unit]), "lucrari.xlsx", "Lucrari", farm, "REGISTRUL LUCRARILOR AGRICOLE")}>Exporta Excel</Btn>
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
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = Array(6).fill({ wch: 20 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fisa Tehnologica");
    XLSX.writeFile(wb, `fisa_tehnologica_${sheet.crop?.name}_${sheet.year}.xlsx`);
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
        <Card title={`Fisa Tehnologica consolidata pe cultura — ${sheet.crop?.name || "-"} (${sheet.year})`} actions={<Btn variant="secondary" onClick={exportSheet}>Exporta Excel</Btn>}>
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
function TabRecoltare({ farmId, token, seasons, crops, harvests, farm, onRefresh }) {
  const [selCropYear, setSelCropYear] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [totalQty, setTotalQty] = useState("");
  const [humidity, setHumidity] = useState("");
  const [destination, setDestination] = useState("");
  const [invoiceStart, setInvoiceStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [success, setSuccess] = useState("");
  const [chartCrop, setChartCrop] = useState("");

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

  // Statistici productie anuala per cultura
  const cropYearStats = useMemo(() => {
    const stats = {};
    harvests.forEach((h) => {
      const cropName = h.sezon?.cultura?.name;
      const year = h.sezon?.year || parseInt(h.harvestDate?.substring(0, 4));
      if (!cropName || !year) return;
      const key = `${cropName}__${year}`;
      if (!stats[key]) stats[key] = { crop: cropName, year, totalKg: 0, totalHa: 0 };
      stats[key].totalKg += h.quantityKg;
      stats[key].totalHa += (h.sezon?.parcel?.areaHa || 0);
    });
    return Object.values(stats)
      .map(s => ({ ...s, kgPerHa: s.totalHa > 0 ? Math.round(s.totalKg / s.totalHa) : 0 }))
      .sort((a, b) => a.crop.localeCompare(b.crop) || a.year - b.year);
  }, [harvests]);

  const cropNames = [...new Set(cropYearStats.map(s => s.crop))];
  const activeCrop = chartCrop || cropNames[0] || "";
  const chartPoints = cropYearStats.filter(s => s.crop === activeCrop);

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
          actions={<Btn variant="secondary" onClick={() => exportExcel(
            ["Nr.crt", "Data", "Produs", "Sola", "Suprafață (ha)", "Cantitate (kg)", "Nr. Aviz", "Umiditate %", "Destinație"],
            session.entries.map((e, i) => [i + 1, session.date, session.crop?.name, `B${e.sezon?.parcel?.block?.blockNumber}/P${e.sezon?.parcel?.parcelNumber}`, e.sezon?.parcel?.areaHa, e.quantityKg, e.avizNumber || "", e.humidity || "", e.destination]),
            `jurnal_recoltare_${session.crop?.name}_${session.date}.xlsx`, "Jurnal Recoltare", farm, "REGISTRUL RECOLTARII"
          )} style={{ fontSize: 12, padding: "4px 12px" }}>Exportă Excel</Btn>}>
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

      {cropYearStats.length > 0 && (
        <Card title="Evolutie Productie Anuala (kg/ha)">
          {/* Selector cultura */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {cropNames.map(c => (
              <button key={c} onClick={() => setChartCrop(c)} style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: c === activeCrop ? 700 : 400,
                background: c === activeCrop ? C.forestLight : C.bg,
                color: c === activeCrop ? C.white : C.textMuted,
                border: `1px solid ${c === activeCrop ? C.forestLight : C.border}`,
              }}>{c}</button>
            ))}
          </div>

          {/* Grafic SVG */}
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <ProductionChart points={chartPoints} />
          </div>

          {/* Tabel sinteza */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cultura", "An", "Suprafata recoltata (ha)", "Total kg", "Randament (kg/ha)"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.forest, background: C.sky, borderBottom: `2px solid ${C.forestLight}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cropYearStats.map((s, i) => (
                <tr key={`${s.crop}${s.year}`} style={{ background: i % 2 === 0 ? C.bgCard : C.bg }}>
                  <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: C.earth }}>{s.crop}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13 }}>{s.year}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13 }}>{s.totalHa.toFixed(2)}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13 }}>{s.totalKg.toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: C.forestLight }}>{s.kgPerHa.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}


// ─────────────────────────────────────────────
// GRAFIC EVOLUTIE PRODUCTIE (SVG bar chart)
// ─────────────────────────────────────────────
function ProductionChart({ points }) {
  // points: [{ year, kgPerHa, totalKg, totalHa }] sorted asc by year
  if (!points || points.length === 0) return <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Nu exista date de recoltat pentru aceasta cultura.</div>;

  const W = 600, H = 210;
  const padL = 62, padR = 20, padT = 28, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...points.map(d => d.kgPerHa), 1);
  const step = chartW / points.length;
  const barW = Math.max(20, Math.min(48, step * 0.55));
  const gridN = 4;
  const barColor = C.forestLight;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 210, display: "block" }}>
      {/* Grid & Y labels */}
      {Array.from({ length: gridN + 1 }).map((_, i) => {
        const y = padT + (chartH / gridN) * i;
        const val = Math.round(maxVal * (1 - i / gridN));
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.border} strokeWidth={0.7} strokeDasharray={i === gridN ? "0" : "4 3"} />
            <text x={padL - 6} y={y} textAnchor="end" fontSize={9} fill={C.textMuted} dominantBaseline="central">{val.toLocaleString()}</text>
          </g>
        );
      })}
      {/* Y axis label */}
      <text x={10} y={padT + chartH / 2} textAnchor="middle" fontSize={9} fill={C.textMuted} transform={`rotate(-90, 10, ${padT + chartH / 2})`}>kg/ha</text>
      {/* Bars */}
      {points.map((d, i) => {
        const barH = Math.max(2, (d.kgPerHa / maxVal) * chartH);
        const x = padL + step * i + (step - barW) / 2;
        const y = padT + chartH - barH;
        return (
          <g key={d.year}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={barColor} opacity={0.85} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fill={C.forest} fontWeight={600}>{d.kgPerHa.toLocaleString()}</text>
            <text x={x + barW / 2} y={H - padB + 14} textAnchor="middle" fontSize={10} fill={C.textMuted}>{d.year}</text>
          </g>
        );
      })}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={C.border} strokeWidth={1} />
      <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke={C.border} strokeWidth={1} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// TAB 6: RAPOARTE APIA (stil prima versiune)
// ─────────────────────────────────────────────
function TabRapoarteApia({ farmId, token, farm }) {
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
    exportExcel(headers, rows, `raport_apia_${year}.xlsx`, "Raport APIA", farm, "CERERE DE PLATA APIA");
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
          <Card actions={<Btn variant="secondary" onClick={exportReport}>Exporta Excel (format APIA)</Btn>}>
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
// TAB 7: REGISTRUL FERMIERULUI (Form 013 APIA)
// ─────────────────────────────────────────────
function TabRegistruFermier({ farmId, token, farm }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api(`/reports/registru-fermier/${farmId}/${year}`, token);
      setData(res);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const doExport = () => {
    if (!data) return;
    const headerRow1 = [
      "Parcela", "BF", "HA", "Cultura", "Supr. Teren", "Arat", "Preg. Teren",
      "Fertilizat", "", "",
      "Tratament", "", "",
      "Semănat", "", "",
      "Lucrări de Întreținere", "Recoltat", "Producție KG/HA"
    ];
    const headerRow2 = [
      "", "", "", "", "", "", "",
      "Data", "Îngrășământ", "Cantitate",
      "Data", "Substanță", "Doză",
      "Data", "Soi, Hibrid", "Cant/HA",
      "", "", ""
    ];
    const merges = [
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },   // Fertilizat
      { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },  // Tratament
      { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } },  // Semănat
      // Vertical merges for single-row headers
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
      { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },
      { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } },
      { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } },
      { s: { r: 0, c: 18 }, e: { r: 1, c: 18 } },
    ];
    const rows = data.rows.map((r) => [
      r.parcela, r.bf, r.ha, r.cultura, r.suprTeren, r.arat, r.pregTeren,
      r.fertilizatData, r.fertilizatIngrasamant, r.fertilizatCantitate,
      r.tratamentData, r.tratamentSubstanta, r.tratamentDoza,
      r.semanatData, r.semanatSoiHibrid, r.semanatCantHa,
      r.lucrariIntretinere, r.recoltat, r.productieKgHa
    ]);
    exportExcelMultiHeader([headerRow1, headerRow2], rows, `registru_fermier_${year}.xlsx`, "Registrul Fermierului", merges, farm, "REGISTRUL FERMIERULUI (FORMULAR 013)");
  };

  const thStyle = { padding: "8px 6px", fontSize: 11, fontWeight: 600, color: C.forest, background: C.sky, borderBottom: `2px solid ${C.forest}`, textAlign: "center", whiteSpace: "nowrap" };
  const tdStyle = { padding: "6px", fontSize: 12, borderBottom: `1px solid ${C.border}`, textAlign: "center" };
  const thGroup = { ...thStyle, background: C.forestLight, color: C.white, letterSpacing: "0.5px" };

  return (
    <>
      <Card title="Registrul Fermierului — Formular 013 APIA">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Input label="An agricol" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 120 }} />
          <Btn onClick={generate} disabled={loading}>{loading ? "Se genereaza..." : "Genereaza Registrul"}</Btn>
        </div>
      </Card>

      {data && (
        <>
          <Card style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                <strong>{data.farm.name}</strong> — {data.farm.sediu} — ID Fermier: {data.farm.cui || "-"}
              </div>
              <Btn variant="secondary" onClick={doExport}>Exporta Excel (.xlsx)</Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400 }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={thStyle}>Parcela</th>
                    <th rowSpan={2} style={thStyle}>BF</th>
                    <th rowSpan={2} style={thStyle}>HA</th>
                    <th rowSpan={2} style={thStyle}>Cultura</th>
                    <th rowSpan={2} style={thStyle}>Supr. Teren</th>
                    <th rowSpan={2} style={thStyle}>Arat</th>
                    <th rowSpan={2} style={thStyle}>Preg. Teren</th>
                    <th colSpan={3} style={thGroup}>Fertilizat</th>
                    <th colSpan={3} style={thGroup}>Tratament</th>
                    <th colSpan={3} style={thGroup}>Semănat</th>
                    <th rowSpan={2} style={thStyle}>Lucrări de Întreținere</th>
                    <th rowSpan={2} style={thStyle}>Recoltat</th>
                    <th rowSpan={2} style={thStyle}>Producție KG/HA</th>
                  </tr>
                  <tr>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Îngrășământ</th>
                    <th style={thStyle}>Cantitate</th>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Substanță</th>
                    <th style={thStyle}>Doză</th>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Soi, Hibrid</th>
                    <th style={thStyle}>Cant/HA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr><td colSpan={19} style={{ ...tdStyle, textAlign: "center", color: C.textMuted, padding: 24 }}>Nu exista date pentru anul selectat.</td></tr>
                  ) : data.rows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={tdStyle}>{r.parcela}</td>
                      <td style={tdStyle}>{r.bf}</td>
                      <td style={tdStyle}>{r.ha}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, textAlign: "left" }}>{r.cultura}</td>
                      <td style={tdStyle}>{r.suprTeren}</td>
                      <td style={tdStyle}>{r.arat || "-"}</td>
                      <td style={tdStyle}>{r.pregTeren || "-"}</td>
                      <td style={tdStyle}>{r.fertilizatData || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "left", maxWidth: 120 }}>{r.fertilizatIngrasamant || "-"}</td>
                      <td style={tdStyle}>{r.fertilizatCantitate || "-"}</td>
                      <td style={tdStyle}>{r.tratamentData || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "left", maxWidth: 120 }}>{r.tratamentSubstanta || "-"}</td>
                      <td style={tdStyle}>{r.tratamentDoza || "-"}</td>
                      <td style={tdStyle}>{r.semanatData || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "left", maxWidth: 120 }}>{r.semanatSoiHibrid || "-"}</td>
                      <td style={tdStyle}>{r.semanatCantHa || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "left", maxWidth: 150, fontSize: 11 }}>{r.lucrariIntretinere || "-"}</td>
                      <td style={tdStyle}>{r.recoltat || "-"}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.productieKgHa || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ marginTop: 12, padding: "10px 16px", background: C.bg, borderRadius: 8, fontSize: 12, color: C.textMuted, display: "flex", justifyContent: "space-between" }}>
            <span>Nume Prenume Semnătura (și ștampila) FERMIER</span>
            <span>Nume Inspectori / Semnătura</span>
          </div>
        </>
      )}
    </>
  );
}


// ─────────────────────────────────────────────
// TAB 8: REGISTRUL EXPLOATAȚIEI (Form 001 APIA)
// ─────────────────────────────────────────────
function TabRegistruExploatatie({ farmId, token, farm }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api(`/reports/registru-exploatatie/${farmId}/${year}`, token);
      setData(res);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const doExport = () => {
    if (!data) return;
    const headerRow1 = [
      "Parcela", "BF", "Suprafața ha",
      "Cultura principală", "", "", "",
      "Cultura secundară înființată",
      "Cultura secundară", "", "",
      "Cultura succesivă", "", "",
      "Cultura de toamnă", "", ""
    ];
    const headerRow2 = [
      "", "", "",
      "Cultura", "Perioada pregătire teren și înființare", "Lucrări agricole efectuate cf. tehnologie", "Perioada recoltare",
      "",
      "Perioada pregătire în teren și înființare", "Lucrări agricole efectuate", "Perioada recoltare/desființare/încorporare",
      "Perioada pregătire teren și înființare", "Lucrări agricole efectuate cf. tehnologie", "Perioada recoltare/desființare/încorporare",
      "Cultura", "Perioada pregătire teren și înființare", "Perioada recoltare"
    ];
    const merges = [
      { s: { r: 0, c: 3 }, e: { r: 0, c: 6 } },    // Cultura principală
      { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } },   // Cultura secundară
      { s: { r: 0, c: 11 }, e: { r: 0, c: 13 } },  // Cultura succesivă
      { s: { r: 0, c: 14 }, e: { r: 0, c: 16 } },  // Cultura de toamnă
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
    ];
    const rows = data.rows.map((r) => [
      r.parcela, r.bf, r.suprafataHa,
      r.principal.cultura, r.principal.pregTeren, r.principal.lucrari, r.principal.recoltare,
      r.culturaSecundaraInfiintata,
      r.secundar.pregTeren, r.secundar.lucrari, r.secundar.recoltare,
      r.succesiv.pregTeren, r.succesiv.lucrari, r.succesiv.recoltare,
      r.toamna.cultura, r.toamna.pregTeren, r.toamna.recoltare
    ]);
    exportExcelMultiHeader([headerRow1, headerRow2], rows, `registru_exploatatie_${year}.xlsx`, "Registrul Exploatatiei", merges, farm, "REGISTRUL EXPLOATATIEI (FORMULAR 001)");
  };

  const thStyle = { padding: "8px 6px", fontSize: 11, fontWeight: 600, color: C.forest, background: C.sky, borderBottom: `2px solid ${C.forest}`, textAlign: "center", whiteSpace: "nowrap" };
  const tdStyle = { padding: "6px", fontSize: 12, borderBottom: `1px solid ${C.border}`, textAlign: "center" };
  const thGroup = { ...thStyle, background: C.forestLight, color: C.white, letterSpacing: "0.5px" };

  return (
    <>
      <Card title="Registrul Exploatației — Formular 001 APIA">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Input label="An agricol" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 120 }} />
          <Btn onClick={generate} disabled={loading}>{loading ? "Se genereaza..." : "Genereaza Registrul"}</Btn>
        </div>
      </Card>

      {data && (
        <>
          <Card style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                <strong>{data.farm.name}</strong> — Sediul exploatației: {data.farm.sediu} — ID Fermier: {data.farm.cui || "-"}
              </div>
              <Btn variant="secondary" onClick={doExport}>Exporta Excel (.xlsx)</Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1600 }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={thStyle}>Parcela</th>
                    <th rowSpan={2} style={thStyle}>BF</th>
                    <th rowSpan={2} style={thStyle}>Suprafața ha</th>
                    <th colSpan={4} style={thGroup}>Cultura principală</th>
                    <th rowSpan={2} style={{ ...thStyle, background: C.wheatLight, color: C.earth }}>Cultura secundară înființată</th>
                    <th colSpan={3} style={thGroup}>Cultura secundară</th>
                    <th colSpan={3} style={thGroup}>Cultura succesivă</th>
                    <th colSpan={3} style={{ ...thGroup, background: C.soil }}>Cultura de toamnă</th>
                  </tr>
                  <tr>
                    <th style={thStyle}>Cultura</th>
                    <th style={thStyle}>Perioada pregătire teren și înființare</th>
                    <th style={thStyle}>Lucrări agricole efectuate cf. tehnologie</th>
                    <th style={thStyle}>Perioada recoltare</th>
                    <th style={thStyle}>Perioada pregătire în teren și înființare</th>
                    <th style={thStyle}>Lucrări agricole efectuate</th>
                    <th style={thStyle}>Perioada recoltare/ desființare/ încorporare</th>
                    <th style={thStyle}>Perioada pregătire teren și înființare</th>
                    <th style={thStyle}>Lucrări agricole efectuate cf. tehnologie</th>
                    <th style={thStyle}>Perioada recoltare/ desființare/ încorporare</th>
                    <th style={thStyle}>Cultura</th>
                    <th style={thStyle}>Perioada pregătire teren și înființare</th>
                    <th style={thStyle}>Perioada recoltare</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr><td colSpan={17} style={{ ...tdStyle, textAlign: "center", color: C.textMuted, padding: 24 }}>Nu exista date pentru anul selectat.</td></tr>
                  ) : data.rows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={tdStyle}>{r.parcela}</td>
                      <td style={tdStyle}>{r.bf}</td>
                      <td style={tdStyle}>{r.suprafataHa}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, textAlign: "left" }}>{r.principal.cultura || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{r.principal.pregTeren || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11, textAlign: "left", maxWidth: 160 }}>{r.principal.lucrari || "-"}</td>
                      <td style={tdStyle}>{r.principal.recoltare || "-"}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, background: i % 2 === 0 ? "#fffbe6" : "#fff8d6" }}>{r.culturaSecundaraInfiintata || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{r.secundar.pregTeren || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11, textAlign: "left", maxWidth: 160 }}>{r.secundar.lucrari || "-"}</td>
                      <td style={tdStyle}>{r.secundar.recoltare || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{r.succesiv.pregTeren || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11, textAlign: "left", maxWidth: 160 }}>{r.succesiv.lucrari || "-"}</td>
                      <td style={tdStyle}>{r.succesiv.recoltare || "-"}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{r.toamna.cultura || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{r.toamna.pregTeren || "-"}</td>
                      <td style={tdStyle}>{r.toamna.recoltare || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}


// ─────────────────────────────────────────────
// TAB 9: MOTORINĂ (stil prima versiune)
// ─────────────────────────────────────────────
function TabMotorina({ farmId, token, seasons, fuelEntries, farm, onRefresh }) {
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

      <Card title="Jurnal Gestiune Motorină" actions={<Btn variant="secondary" onClick={() => exportExcel(["Tip", "Data", "Litri", "Preț/L", "Factură/Utilaj", "Furnizor/Lucrare", "Note"], [...fuelEntries].sort((a, b) => b.date.localeCompare(a.date)).map(e => [e.type, e.date, e.liters, e.pricePerLiter || "", e.invoiceNumber || e.equipment || "", e.supplier || e.workDescription || "", e.notes || ""]), "jurnal_motorina.xlsx", "Jurnal Motorina", farm, "REGISTRUL MOTORINEI")}>Exportă Excel</Btn>}>
        <Table headers={["Tip", "Data", "Litri", "Detalii", "Note", "Acțiuni"]}
          rows={[...fuelEntries].sort((a, b) => b.date.localeCompare(a.date)).map(e => [
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
  const [showFarmEdit, setShowFarmEdit] = useState(false);

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

  const activeFarmObj = farms.find((f) => f.id === activeFarm) || null;
  const tabs = ["Dashboard", "Terenuri", "Culturi", "Lucrari", "Fise Tehnice", "Recoltare", "Rapoarte APIA", "Reg. Fermier", "Reg. Exploatatie", "Motorina"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {showFarmEdit && activeFarmObj && (
        <FarmEdit
          token={token}
          farm={activeFarmObj}
          onSaved={(updated) => { setFarms((prev) => prev.map((f) => f.id === updated.id ? updated : f)); setShowFarmEdit(false); }}
          onCancel={() => setShowFarmEdit(false)}
        />
      )}
      <header style={{ background: `linear-gradient(135deg, ${C.earth} 0%, ${C.forest} 100%)`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/tractor-icon.jpg" alt="AgroSistem" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ color: C.cream, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>AgroSistem</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {farms.length > 0 && (
            <select value={activeFarm || ""} onChange={(e) => setActiveFarm(Number(e.target.value))} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.wheatLight}`, background: "rgba(255,255,255,0.1)", color: C.cream, fontSize: 14, cursor: "pointer" }}>
              {farms.map((f) => <option key={f.id} value={f.id} style={{ color: C.text }}>{f.name}</option>)}
            </select>
          )}
          {activeFarmObj && (
            <button onClick={() => setShowFarmEdit(true)} title="Editare date ferma" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: C.wheatLight, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>&#9998; Editare ferma</button>
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
            {tab === 1 && <TabTerenuri farmId={activeFarm} token={token} blocks={blocks} seasons={seasons} farm={activeFarmObj} onRefresh={fetchData} />}
            {tab === 2 && <TabCulturi token={token} blocks={blocks} crops={crops} seasons={seasons} farm={activeFarmObj} onRefresh={fetchData} />}
            {tab === 3 && <TabLucrari token={token} seasons={seasons} workTypes={workTypes} works={works} farm={activeFarmObj} onRefresh={fetchData} />}
            {tab === 4 && <TabFiseTehnice farmId={activeFarm} token={token} crops={crops} seasons={seasons} />}
            {tab === 5 && <TabRecoltare farmId={activeFarm} token={token} seasons={seasons} crops={crops} harvests={harvests} farm={activeFarmObj} onRefresh={fetchData} />}
            {tab === 6 && <TabRapoarteApia farmId={activeFarm} token={token} farm={activeFarmObj} />}
            {tab === 7 && <TabRegistruFermier farmId={activeFarm} token={token} farm={activeFarmObj} />}
            {tab === 8 && <TabRegistruExploatatie farmId={activeFarm} token={token} farm={activeFarmObj} />}
            {tab === 9 && <TabMotorina farmId={activeFarm} token={token} seasons={seasons} fuelEntries={fuelEntries} farm={activeFarmObj} onRefresh={fetchData} />}
          </>
        )}
      </main>
    </div>
  );
}
