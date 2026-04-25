import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import "./style.css"

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    color_group: "",
    acrylic: "",
    acrylic_name: "",
    lp: "",
    lp_name: "",
    enamel: "",
    stock: 1,
    note: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    setItems(data || [])
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function addItem() {
    if (!form.acrylic && !form.acrylic_name) return

    await supabase.from("paints").insert([
      {
        color_group: form.color_group,
        acrylic: form.acrylic,
        acrylic_name: form.acrylic_name,
        lp: form.lp,
        lp_name: form.lp_name,
        enamel: form.enamel,
        stock: Number(form.stock),
        note: form.note
      }
    ])

    setForm({
      color_group: "",
      acrylic: "",
      acrylic_name: "",
      lp: "",
      lp_name: "",
      enamel: "",
      stock: 1,
      note: ""
    })

    fetchData()
  }

  async function deleteItem(id) {
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  async function updateStock(item, change) {
    const next = Math.max(0, item.stock + change)

    await supabase
      .from("paints")
      .update({ stock: next })
      .eq("id", item.id)

    fetchData()
  }

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      <div className="card form">
        <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
        <input name="acrylic" placeholder="Acrylic 色號" value={form.acrylic} onChange={handleChange} />
        <input name="acrylic_name" placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={handleChange} />
        <input name="lp" placeholder="LP 色號" value={form.lp} onChange={handleChange} />
        <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
        <input name="enamel" placeholder="Enamel 色號" value={form.enamel} onChange={handleChange} />
        <input name="stock" type="number" value={form.stock} onChange={handleChange} />
        <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />

        <button className="primary" onClick={addItem}>
          新增資料
        </button>
      </div>

      <div className="list">
        {items.map(item => (
          <div key={item.id} className="item-card">

            <div className="left">
              {item.acrylic && <div className="code">{item.acrylic}</div>}
              {item.acrylic_name && <div className="name">{item.acrylic_name}</div>}

              {item.color_group && (
                <span className="tag">{item.color_group}</span>
              )}

              {(item.lp || item.lp_name || item.enamel || item.note) && (
                <div className="sub">
                  {item.lp && <span>LP: {item.lp}</span>}
                  {item.lp_name && <span>LP 名稱: {item.lp_name}</span>}
                  {item.enamel && <span>Enamel: {item.enamel}</span>}
                  {item.note && <span>備註: {item.note}</span>}
                </div>
              )}
            </div>

            <div className="right">
              <div className="stock">
                <button onClick={() => updateStock(item, -1)}>－</button>
                <span>{item.stock}</span>
                <button onClick={() => updateStock(item, 1)}>＋</button>
              </div>

              <button className="danger" onClick={() => deleteItem(item.id)}>
                刪除
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}