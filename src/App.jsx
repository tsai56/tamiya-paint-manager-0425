import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function App() {
  const [data, setData] = useState([])
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
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from("paints").select("*")
    setData(data || [])
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function save() {
    if (editingId) {
      await supabase.from("paints").update(form).eq("id", editingId)
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
    setEditingId(null)
    load()
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm(row)
  }

  async function deleteRow(id) {
    await supabase.from("paints").delete().eq("id", id)
    load()
  }

  async function updateStock(row, delta) {
    const next = Math.max(0, Number(row.stock || 0) + delta)
    await supabase.from("paints").update({ stock: next }).eq("id", row.id)
    load()
  }

  // ✅ CSV 匯入（支援中文欄位）
  function parseCSV(line) {
    return line.split(",")
  }

  async function importCSV(e) {
    const file = e.target.files[0]
    const text = await file.text()

    const lines = text.split("\n")
    const headers = parseCSV(lines[0])

    const rows = lines.slice(1).map(line => {
      const values = parseCSV(line)
      const row = {}

      headers.forEach((h, i) => {
        row[h.trim()] = values[i]
      })

      return {
        color_group: row.color_group || row["色系"] || "",
        acrylic: row.acrylic || row["Acrylic"] || "",
        acrylic_name: row.acrylic_name || row["Acrylic 官方名稱"] || "",
        lp: row.lp || row["LP"] || "",
        lp_name: row.lp_name || row["LP 官方名稱"] || "",
        enamel: row.enamel || row["Enamel"] || "",
        stock: Number(row.stock || row["庫存"] || 1),
        note: row.note || row["備註"] || ""
      }
    })

    await supabase.from("paints").insert(rows)
    load()
  }

  function exportCSV() {
    const header = [
      "color_group",
      "acrylic",
      "acrylic_name",
      "lp",
      "lp_name",
      "enamel",
      "stock",
      "note"
    ]

    const rows = data.map(row =>
      header.map(h => row[h] || "").join(",")
    )

    const csv = [header.join(","), ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "paints.csv"
    a.click()
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🎨 Tamiya 三漆系管理</h1>

      {/* 表單 */}
      <div>
        <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
        <input name="acrylic" placeholder="Acrylic" value={form.acrylic} onChange={handleChange} />
        <input name="acrylic_name" placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={handleChange} />
        <input name="lp" placeholder="LP" value={form.lp} onChange={handleChange} />
        <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
        <input name="enamel" placeholder="Enamel" value={form.enamel} onChange={handleChange} />
        <input name="stock" type="number" value={form.stock} onChange={handleChange} />
        <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />

        <button onClick={save}>
          {editingId ? "儲存修改" : "新增"}
        </button>
      </div>

      {/* 匯入匯出 */}
      <div style={{ marginTop: 20 }}>
        <input type="file" onChange={importCSV} />
        <button onClick={exportCSV}>匯出 CSV</button>
      </div>

      {/* 表格 */}
      <table border="1" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>色系</th>
            <th>Acrylic</th>
            <th>名稱</th>
            <th>LP</th>
            <th>LP 名稱</th>
            <th>Enamel</th>
            <th>庫存</th>
            <th>備註</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              <td>{row.color_group}</td>
              <td>{row.acrylic}</td>
              <td>{row.acrylic_name}</td>
              <td>{row.lp}</td>
              <td>{row.lp_name}</td>
              <td>{row.enamel}</td>

              <td>
                <button onClick={() => updateStock(row, -1)}>-</button>
                {row.stock}
                <button onClick={() => updateStock(row, 1)}>+</button>
              </td>

              <td>{row.note}</td>

              <td>
                <button onClick={() => startEdit(row)}>編輯</button>
                <button onClick={() => deleteRow(row.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}