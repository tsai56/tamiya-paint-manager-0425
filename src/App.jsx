import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import "./App.css"

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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

const fields = [
  "color_group",
  "acrylic",
  "acrylic_name",
  "lp",
  "lp_name",
  "enamel",
  "stock",
  "note"
]

export default function App() {
  const [data, setData] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return alert(error.message)
    setData(data || [])
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm(row)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveData() {
    const payload = { ...form, stock: Number(form.stock || 1) }

    if (editingId) {
      await supabase.from("paints").update(payload).eq("id", editingId)
    } else {
      await supabase.from("paints").insert([payload])
    }

    setEditingId(null)
    setForm(emptyForm)
    load()
  }

  async function deleteRow(id) {
    await supabase.from("paints").delete().eq("id", id)
    load()
  }

  async function updateStock(row, delta) {
    const next = Math.max(0, (row.stock || 0) + delta)
    await supabase.from("paints").update({ stock: next }).eq("id", row.id)
    load()
  }

  // ===== 匯出 =====
  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "paints.json"
    a.click()
  }

  function exportCSV() {
    const rows = data.map(row =>
      fields.map(f => `"${row[f] || ""}"`).join(",")
    )
    const csv = [fields.join(","), ...rows].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "paints.csv"
    a.click()
  }

  // ===== 匯入 =====
  async function importJSON(e) {
    const file = e.target.files[0]
    const text = await file.text()
    const rows = JSON.parse(text)

    await supabase.from("paints").insert(rows)
    load()
  }

  async function importCSV(e) {
    const file = e.target.files[0]
    const text = await file.text()
    const lines = text.split("\n")

    const headers = lines[0].split(",")

    const rows = lines.slice(1).map(line => {
      const values = line.split(",")
      let obj = {}
      headers.forEach((h, i) => {
        obj[h] = values[i]?.replace(/"/g, "") || ""
      })
      return obj
    })

    await supabase.from("paints").insert(rows)
    load()
  }

  const filtered = useMemo(() => {
    return data.filter(row =>
      Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  return (
    <div className="container">
      <h1>🎨 Tamiya 三漆系管理</h1>

      {/* ===== 表單 ===== */}
      <div className="form">
        {fields.map(f => (
          <input
            key={f}
            name={f}
            placeholder={f}
            value={form[f]}
            onChange={handleChange}
          />
        ))}

        <button onClick={saveData}>
          {editingId ? "儲存修改" : "新增"}
        </button>

        {editingId && (
          <button onClick={cancelEdit}>取消</button>
        )}
      </div>

      {/* ===== 匯入匯出 ===== */}
      <div style={{ margin: "20px 0" }}>
        <label>
          匯入 CSV
          <input type="file" onChange={importCSV} hidden />
        </label>

        <label style={{ marginLeft: 10 }}>
          匯入 JSON
          <input type="file" onChange={importJSON} hidden />
        </label>

        <button onClick={exportCSV} style={{ marginLeft: 10 }}>
          匯出 CSV
        </button>

        <button onClick={exportJSON} style={{ marginLeft: 10 }}>
          匯出 JSON
        </button>
      </div>

      {/* ===== 搜尋 ===== */}
      <input
        placeholder="搜尋..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* ===== 表格 ===== */}
      <table>
        <thead>
          <tr>
            {fields.map(f => <th key={f}>{f}</th>)}
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(row => (
            <tr key={row.id}>
              {fields.map(f => (
                <td key={f}>{row[f] || "-"}</td>
              ))}

              <td>
                <button onClick={() => startEdit(row)}>編輯</button>
                <button onClick={() => deleteRow(row.id)}>刪除</button>
                <button onClick={() => updateStock(row, 1)}>＋</button>
                <button onClick={() => updateStock(row, -1)}>－</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}