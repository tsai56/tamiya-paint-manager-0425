import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import "./style.css"

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    color_group: "",
    acrylic_code: "",
    acrylic_name: "",
    lp_code: "",
    lp_name: "",
    enamel_code: "",
    note: "",
    stock: 1
  })

  // 讀資料
  const fetchData = async () => {
    const { data } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    setItems(data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 新增
  const handleAdd = async () => {
    if (!form.acrylic_code && !form.acrylic_name) return

    await supabase.from("paints").insert([form])

    setForm({
      color_group: "",
      acrylic_code: "",
      acrylic_name: "",
      lp_code: "",
      lp_name: "",
      enamel_code: "",
      note: "",
      stock: 1
    })

    fetchData()
  }

  // 刪除
  const handleDelete = async (id) => {
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  // 庫存
  const updateStock = async (id, value) => {
    await supabase.from("paints").update({ stock: value }).eq("id", id)
    fetchData()
  }

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      {/* 表單 */}
      <div className="card form">
        <input placeholder="色系"
          value={form.color_group}
          onChange={e => setForm({ ...form, color_group: e.target.value })}
        />
        <input placeholder="Acrylic 色號"
          value={form.acrylic_code}
          onChange={e => setForm({ ...form, acrylic_code: e.target.value })}
        />
        <input placeholder="Acrylic 名稱"
          value={form.acrylic_name}
          onChange={e => setForm({ ...form, acrylic_name: e.target.value })}
        />
        <input placeholder="LP 色號"
          value={form.lp_code}
          onChange={e => setForm({ ...form, lp_code: e.target.value })}
        />
        <input placeholder="LP 名稱"
          value={form.lp_name}
          onChange={e => setForm({ ...form, lp_name: e.target.value })}
        />
        <input placeholder="Enamel 色號"
          value={form.enamel_code}
          onChange={e => setForm({ ...form, enamel_code: e.target.value })}
        />
        <input type="number"
          value={form.stock}
          onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
        />
        <input placeholder="備註"
          value={form.note}
          onChange={e => setForm({ ...form, note: e.target.value })}
        />

        <button className="primary" onClick={handleAdd}>
          新增資料
        </button>
      </div>

      {/* 列表 */}
      <div className="list">
        {items.map(item => (
          <div key={item.id} className="item-card">

            <div className="left">
              {item.acrylic_code && (
                <div className="code">{item.acrylic_code}</div>
              )}

              {item.acrylic_name && (
                <div className="name">{item.acrylic_name}</div>
              )}

              {item.color_group && (
                <span className="tag">{item.color_group}</span>
              )}

              <div className="sub">
                {item.lp_code && <>LP: {item.lp_code} </>}
                {item.enamel_code && <>Enamel: {item.enamel_code}</>}
              </div>
            </div>

            <div className="right">
              <div className="stock">
                <button onClick={() =>
                  updateStock(item.id, Math.max(0, item.stock - 1))
                }>-</button>

                <span>{item.stock}</span>

                <button onClick={() =>
                  updateStock(item.id, item.stock + 1)
                }>+</button>
              </div>

              <button className="danger" onClick={() => handleDelete(item.id)}>
                刪除
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}