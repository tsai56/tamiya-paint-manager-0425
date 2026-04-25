import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    color_group: "",
    acrylic: "",
    acrylic_name: "",
    lp: "",
    lp_name: "",
    enamel: "",
    note: "",
    stock: 1,
  });

  async function fetchData() {
    const { data } = await supabase.from("paints").select("*").order("id", { ascending: false });
    setList(data || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function addItem() {
    if (!form.acrylic) return;

    await supabase.from("paints").insert([form]);
    setForm({
      color_group: "",
      acrylic: "",
      acrylic_name: "",
      lp: "",
      lp_name: "",
      enamel: "",
      note: "",
      stock: 1,
    });
    fetchData();
  }

  async function updateStock(id, value) {
    const item = list.find((i) => i.id === id);
    const newStock = Math.max(0, item.stock + value);

    await supabase.from("paints").update({ stock: newStock }).eq("id", id);
    fetchData();
  }

  async function remove(id) {
    await supabase.from("paints").delete().eq("id", id);
    fetchData();
  }

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      <div className="card form">
        <input placeholder="色系" value={form.color_group} onChange={(e) => setForm({ ...form, color_group: e.target.value })} />
        <input placeholder="Acrylic 色號" value={form.acrylic} onChange={(e) => setForm({ ...form, acrylic: e.target.value })} />
        <input placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={(e) => setForm({ ...form, acrylic_name: e.target.value })} />
        <input placeholder="LP 色號" value={form.lp} onChange={(e) => setForm({ ...form, lp: e.target.value })} />
        <input placeholder="LP 名稱" value={form.lp_name} onChange={(e) => setForm({ ...form, lp_name: e.target.value })} />
        <input placeholder="Enamel 色號" value={form.enamel} onChange={(e) => setForm({ ...form, enamel: e.target.value })} />
        <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input placeholder="備註" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

        <button className="primary" onClick={addItem}>新增資料</button>
      </div>

      <div className="list">
        {list.map((item) => (
          <div className="item-card" key={item.id}>
            <div className="left">
              <div className="code">{item.acrylic}</div>
              <div className="name">{item.acrylic_name}</div>
              <div className="tag">{item.color_group}</div>

              <div className="sub">
                {item.enamel && <div>Enamel: {item.enamel}</div>}
                {item.note && <div>備註: {item.note}</div>}
              </div>
            </div>

            <div className="right">
              <div className="stock">
                <button onClick={() => updateStock(item.id, -1)}>-</button>
                <span>{item.stock}</span>
                <button onClick={() => updateStock(item.id, 1)}>+</button>
              </div>

              <button className="danger" onClick={() => remove(item.id)}>刪除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}