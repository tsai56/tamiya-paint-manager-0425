import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import "./style.css"

const emptyForm = {
  color_group: "",
  acrylic: "",
  acrylic_name: "",
  lp: "",
  lp_name: "",
  enamel: "",
  stock: 1,
  note: ""
}

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)

  async function fetchData() {
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      alert("讀取失敗：" + error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function addItem() {
    if (!form.acrylic && !form.lp && !form.enamel && !form.acrylic_name) {
      alert("請至少輸入一個色號或名稱")
      return
    }

    const payload = {
      color_group: form.color_group || "",
      acrylic: form.acrylic || "",
      acrylic_name: form.acrylic_name || "",
      lp: form.lp || "",
      lp_name: form.lp_name || "",
      enamel: form.enamel || "",
      stock: Number(form.stock || 1),
      note: form.note || ""
    }

    const { error } = await supabase.from("paints").insert([payload])

    if (error) {
      alert("新增失敗：" + error.message)
      return
    }

    setForm(emptyForm)
    fetchData()
  }

  async function deleteItem(id) {
    if (!confirm("確定要刪除這筆資料嗎？")) return

    const { error } = await supabase.from("paints").delete().eq("id", id)

    if (error) {
      alert("刪除失敗：" + error.message)
      return
    }

    fetchData()
  }

  async function updateStock(item, change) {
    const nextStock = Math.max(0, Number(item.stock || 0) + change)

    const { error } = await supabase
      .from("paints")
      .update({ stock: nextStock })
      .eq("id", item.id)

    if (error) {
      alert("庫存更新失敗：" + error.message)
      return
    }

    fetchData()
  }

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      <div className="card form">
        <input
          name="color_group"
          placeholder="色系"
          value={form.color_group}
          onChange={handleChange}
        />
        <input
          name="acrylic"
          placeholder="Acrylic 色號"
          value={form.acrylic}
          onChange={handleChange}
        />
        <input
          name="acrylic_name"
          placeholder="Acrylic 名稱"
          value={form.acrylic_name}
          onChange={handleChange}
        />
        <input
          name="lp"
          placeholder="LP 色號"
          value={form.lp}
          onChange={handleChange}
        />
        <input
          name="lp_name"
          placeholder="LP 名稱"
          value={form.lp_name}
          onChange={handleChange}
        />
        <input
          name="enamel"
          placeholder="Enamel 色號"
          value={form.enamel}
          onChange={handleChange}
        />
        <input
          name="stock"
          type="number"
          placeholder="庫存"
          value={form.stock}
          onChange={handleChange}
        />
        <input
          name="note"
          placeholder="備註"
          value={form.note}
          onChange={handleChange}
        />

        <button className="primary" onClick={addItem}>
          新增資料
        </button>
      </div>

      <div className="list">
        {items.map(item => {
          const acrylicCode = item.acrylic || item.acrylic_code || ""
          const acrylicName = item.acrylic_name || ""
          const lpCode = item.lp || item.lp_code || ""
          const lpName = item.lp_name || ""
          const enamelCode = item.enamel || item.enamel_code || ""
          const colorGroup = item.color_group || ""
          const note = item.note || ""

          return (
            <div key={item.id} className="item-card">
              <div className="left">
                {acrylicCode && <div className="code">{acrylicCode}</div>}
                {acrylicName && <div className="name">{acrylicName}</div>}

                {colorGroup && (
                  <span className="tag">{colorGroup}</span>
                )}

                {(lpCode || lpName || enamelCode || note) && (
                  <div className="sub">
                    {lpCode && <span>LP：{lpCode}</span>}
                    {lpName && <span>LP 名稱：{lpName}</span>}
                    {enamelCode && <span>Enamel：{enamelCode}</span>}
                    {note && <span>備註：{note}</span>}
                  </div>
                )}
              </div>

              <div className="right">
                <div className="stock">
                  <button onClick={() => updateStock(item, -1)}>－</button>
                  <span>{item.stock || 0}</span>
                  <button onClick={() => updateStock(item, 1)}>＋</button>
                </div>

                <button className="danger" onClick={() => deleteItem(item.id)}>
                  刪除
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}