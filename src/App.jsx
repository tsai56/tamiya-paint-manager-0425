import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import "./App.css"

export default function App() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState(null)

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

  // 讀取資料
  const fetchData = async () => {
    const { data } = await supabase.from("paints").select("*").order("created_at", { ascending: false })
    setRows(data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 輸入
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 新增 or 更新
  const handleSubmit = async () => {
    if (editingId) {
      await supabase.from("paints").update(form).eq("id", editingId)
      setEditingId(null)
    } else {
      await supabase.from("paints").insert([form])
    }

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

  // 編輯
  const startEdit = (row) => {
    setForm(row)
    setEditingId(row.id)
  }

  // 刪除
  const deleteRow = async (id) => {
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  // 庫存 + -
  const updateStock = async (row, delta) => {
    const newStock = Math.max(0, (row.stock || 0) + delta)
    await supabase.from("paints").update({ stock: newStock }).eq("id", row.id)
    fetchData()
  }

  // 搜尋
  const filtered = rows.filter((r) =>
    `${r.color_group} ${r.acrylic} ${r.acrylic_name} ${r.note}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // 匯出 JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "paints.json"
    a.click()
  }

  // 匯入 JSON
  const importJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const data = JSON.parse(reader.result)
      await supabase.from("paints").insert(data)
      fetchData()
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <h1>🎨 Tamiya 三漆系管理</h1>

      {/* 新增 */}
      <div className="card">
        <div className="form">
          <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
          <input name="acrylic" placeholder="Acrylic 色號" value={form.acrylic} onChange={handleChange} />
          <input name="acrylic_name" placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={handleChange} />
          <input name="lp" placeholder="LP 色號" value={form.lp} onChange={handleChange} />
          <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
          <input name="enamel" placeholder="Enamel 色號" value={form.enamel} onChange={handleChange} />
          <input name="stock" type="number" value={form.stock} onChange={handleChange} />
          <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />
        </div>

        <button className="primary" onClick={handleSubmit}>
          {editingId ? "更新資料" : "新增資料"}
        </button>
      </div>

      {/* 工具列 */}
      <div className="toolbar">
        <input
          placeholder="搜尋..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={exportJSON}>匯出 JSON</button>

        <label className="upload">
          匯入 JSON
          <input type="file" onChange={importJSON} hidden />
        </label>
      </div>

      {/* 卡片列表 */}
      <div className="list">
        {filtered.map((row) => (
          <div key={row.id} className="item">
            <div className="left">
              <div className="code">{row.acrylic || "未填色號"}</div>
            </div>

            <div className="content">
              {row.acrylic && <h2>{row.acrylic}</h2>}
              {row.acrylic_name && <p className="name">{row.acrylic_name}</p>}

              <div className="meta">
                {/* 只顯示有填的 */}
                {row.color_group && <span className="tag">{row.color_group}</span>}
                {row.lp && <span>LP：{row.lp}</span>}
                {row.enamel && <span>Enamel：{row.enamel}</span>}
                {row.note && <span>備註：{row.note}</span>}
              </div>
            </div>

            <div className="right">
              <div className="stock">
                <button onClick={() => updateStock(row, -1)}>-</button>
                <span>{row.stock}</span>
                <button onClick={() => updateStock(row, 1)}>+</button>
              </div>

              <div className="actions">
                <button onClick={() => startEdit(row)}>編輯</button>
                <button className="danger" onClick={() => deleteRow(row.id)}>刪除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}