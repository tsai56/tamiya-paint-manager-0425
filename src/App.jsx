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
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [keyword, setKeyword] = useState("")
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      console.error("讀取失敗", error)
      alert("讀取失敗：" + error.message)
      return
    }

    setRows(data || [])
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function saveData() {
    if (!form.acrylic && !form.lp && !form.enamel) {
      alert("請至少填一個色號")
      return
    }

    const payload = {
      color_group: form.color_group,
      acrylic: form.acrylic,
      acrylic_name: form.acrylic_name,
      lp: form.lp,
      lp_name: form.lp_name,
      enamel: form.enamel,
      stock: Number(form.stock || 1),
      note: form.note
    }

    if (editId) {
      const { error } = await supabase
        .from("paints")
        .update(payload)
        .eq("id", editId)

      if (error) {
        alert("更新失敗：" + error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from("paints")
        .insert([payload])

      if (error) {
        alert("新增失敗：" + error.message)
        return
      }
    }

    setForm(emptyForm)
    setEditId(null)
    fetchData()
  }

  function startEdit(row) {
    setEditId(row.id)
    setForm({
      color_group: row.color_group || "",
      acrylic: row.acrylic || "",
      acrylic_name: row.acrylic_name || "",
      lp: row.lp || "",
      lp_name: row.lp_name || "",
      enamel: row.enamel || "",
      stock: row.stock || 1,
      note: row.note || ""
    })
  }

  async function deleteRow(id) {
    if (!confirm("確定要刪除這筆資料嗎？")) return

    const { error } = await supabase
      .from("paints")
      .delete()
      .eq("id", id)

    if (error) {
      alert("刪除失敗：" + error.message)
      return
    }

    fetchData()
  }

  async function updateStock(row, delta) {
    const nextStock = Math.max(0, Number(row.stock || 0) + delta)

    const { error } = await supabase
      .from("paints")
      .update({ stock: nextStock })
      .eq("id", row.id)

    if (error) {
      alert("庫存更新失敗：" + error.message)
      return
    }

    fetchData()
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tamiya-paints.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(e) {
    const file = e.target.files[0]
    if (!file) return

    const text = await file.text()
    const json = JSON.parse(text)

    const payload = json.map(row => ({
      color_group: row.color_group || "",
      acrylic: row.acrylic || "",
      acrylic_name: row.acrylic_name || "",
      lp: row.lp || "",
      lp_name: row.lp_name || "",
      enamel: row.enamel || "",
      stock: Number(row.stock || 1),
      note: row.note || ""
    }))

    const { error } = await supabase
      .from("paints")
      .insert(payload)

    if (error) {
      alert("匯入失敗：" + error.message)
      return
    }

    e.target.value = ""
    fetchData()
  }

  const filteredRows = rows.filter(row =>
    [
      row.color_group,
      row.acrylic,
      row.acrylic_name,
      row.lp,
      row.lp_name,
      row.enamel,
      row.note
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword.toLowerCase())
  )

  return (
    <div className="app">
      <h1>🎨 Tamiya 三漆系管理</h1>

      <div className="card">
        <div className="form">
          <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
          <input name="acrylic" placeholder="Acrylic 色號" value={form.acrylic} onChange={handleChange} />
          <input name="acrylic_name" placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={handleChange} />
          <input name="lp" placeholder="LP 色號" value={form.lp} onChange={handleChange} />
          <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
          <input name="enamel" placeholder="Enamel 色號" value={form.enamel} onChange={handleChange} />
          <input name="stock" type="number" placeholder="庫存" value={form.stock} onChange={handleChange} />
          <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />
        </div>

        <button className="primary" onClick={saveData}>
          {editId ? "更新資料" : "新增資料"}
        </button>
      </div>

      <div className="toolbar">
        <input
          placeholder="搜尋..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={exportJSON}>匯出 JSON</button>

        <label className="upload">
          匯入 JSON
          <input type="file" accept=".json" onChange={importJSON} hidden />
        </label>
      </div>

      <div className="table">
        {filteredRows.map(row => (
          <div className="row" key={row.id}>
            <div className="info">
              <b>{row.acrylic || row.lp || row.enamel || "未填色號"}</b>
              <span>{row.acrylic_name || row.lp_name || "-"}</span>
              <small>
                色系：{row.color_group || "-"} ｜ LP：{row.lp || "-"} ｜ Enamel：{row.enamel || "-"}
              </small>
              <small>{row.note || ""}</small>
            </div>

            <div className="stock">
              <button onClick={() => updateStock(row, -1)}>-</button>
              <span>{row.stock}</span>
              <button onClick={() => updateStock(row, 1)}>+</button>
            </div>

            <div className="actions">
              <button onClick={() => startEdit(row)}>編輯</button>
              <button className="danger" onClick={() => deleteRow(row.id)}>
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}