import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  "https://trussxmpcekybkdhxkjx.supabase.co",
  "sb_publishable_ytXFWosBfUiwrhVWPeqUAg_oiyitMLE"
);

export default function App() {
  const [paints, setPaints] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("paints").select("*").order("id", { ascending: false });
    setPaints(data || []);
    setStatus(`讀取成功，共 ${data?.length || 0} 筆`);
  }

  function parse(text) {
    const code = text.match(/(XF|X|LP)-?\d+/i)?.[0]?.toUpperCase() || "";
    return code.replace(/(XF|X|LP)(\d+)/, "$1-$2");
  }

  function getSeries(text) {
    if (text.includes("黑")) return "black";
    if (text.includes("白")) return "white";
    if (text.includes("綠")) return "green";
    if (text.includes("金") || text.includes("銀")) return "metal";
    return "default";
  }

  function getType(item) {
    if (item.lp) return "lp";
    if (item.enamel) return "enamel";
    return "acrylic";
  }

  async function add() {
    if (!input) return;

    const code = parse(input);
    const exist = paints.find(p =>
      [p.acrylic, p.lp, p.enamel].join(" ").includes(code)
    );

    if (exist) {
      await updateStock(exist.id, 1);
      setInput("");
      return;
    }

    await supabase.from("paints").insert([{
      series: getSeries(input),
      acrylic: code.startsWith("X") ? code : "",
      enamel: code.startsWith("X") ? code : "",
      lp: code.startsWith("LP") ? code : "",
      acrylic_name: input,
      stock: 1,
      note: "快速新增"
    }]);

    setInput("");
    load();
  }

  async function updateStock(id, delta) {
    const item = paints.find(p => p.id === id);
    await supabase.from("paints")
      .update({ stock: Math.max(0, item.stock + delta) })
      .eq("id", id);
    load();
  }

  async function remove(id) {
    await supabase.from("paints").delete().eq("id", id);
    load();
  }

  const total = useMemo(
    () => paints.reduce((a, b) => a + b.stock, 0),
    [paints]
  );

  return (
    <div className="app">
      <h1>🎨 Tamiya Paint Manager</h1>

      <div className="addBox">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="貼上：TAMIYA XF-85 橡膠黑"
        />
        <button onClick={add}>＋ 新增</button>
      </div>

      <div className="stats">
        <div>總品項 {paints.length}</div>
        <div>總庫存 {total}</div>
        <div>{status}</div>
      </div>

      {paints.map(p => (
        <div className={`card ${p.series}`} key={p.id}>
          <div className="left">
            <div className="code">{p.acrylic || p.lp}</div>
            <div className={`badge ${getType(p)}`}>
              {getType(p)}
            </div>
          </div>

          <div className="info">
            <h3>{p.acrylic_name}</h3>
            <div className={`tag ${p.series}`}>{p.series}</div>
            <p>Acrylic: {p.acrylic || "—"} / LP: {p.lp || "—"} / Enamel: {p.enamel || "—"}</p>
          </div>

          <div className="stock">
            <div>{p.stock}</div>
            <button onClick={() => updateStock(p.id, -1)}>-</button>
            <button onClick={() => updateStock(p.id, 1)}>+</button>
          </div>

          <button className="delete" onClick={() => remove(p.id)}>
            刪除
          </button>
        </div>
      ))}
    </div>
  );
}