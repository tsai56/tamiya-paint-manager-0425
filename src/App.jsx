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
  { key: "color_group", label: "色系", placeholder: "例如：黑色" },
  { key: "acrylic", label: "Acrylic 色號", placeholder: "例如：XF-85" },
  { key: "acrylic_name", label: "Acrylic 名稱", placeholder: "例如：Rubber Black" },
  { key: "lp", label: "LP 色號", placeholder: "例如：LP-65" },
  { key: "lp_name", label: "LP 名稱", placeholder: "例如：Rubber Black" },
  { key: "enamel", label: "Enamel 色號", placeholder: "例如：XF-85" },
  { key: "stock", label: "庫存", placeholder: "1" },
  { key: "note", label: "備註", placeholder: "補充說明" }
]

const fieldKeys = fields.map(f => f.key)

export default function App() {
  const [data, setData] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert("讀取失敗：" + error.message)
      setLoading(false)
      return
    }

    setData(data || [])
    setLoading(false)
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
      color_group: form.color_group || "",
      acrylic: form.acrylic || "",
      acrylic_name: form.acrylic_name || "",
      lp: form.lp || "",
      lp_name: form.lp_name || "",
      enamel: form.enamel || "",
      stock: Number(form.stock || 1),
      note: form.note || ""
    }

    if (editingId) {
      const { error } = await supabase
        .from("paints")
        .update(payload)
        .eq("id", editingId)

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
    setEditingId(null)
    load()
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      color_group: row.color_group || "",
      acrylic: row.acrylic || "",
      acrylic_name: row.acrylic_name || "",
      lp: row.lp || "",
      lp_name: row.lp_name || "",
      enamel: row.enamel || "",
      stock: row.stock ?? 1,
      note: row.note || ""
    })

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function deleteRow(id) {
    if (!window.confirm("確定要刪除這筆資料嗎？")) return

    const { error } = await supabase
      .from("paints")
      .delete()
      .eq("id", id)

    if (error) {
      alert("刪除失敗：" + error.message)
      return
    }

    load()
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

    load()
  }

  function exportJSON() {
    const cleanData = data.map(row => ({
      color_group: row.color_group || "",
      acrylic: row.acrylic || "",
      acrylic_name: row.acrylic_name || "",
      lp: row.lp || "",
      lp_name: row.lp_name || "",
      enamel: row.enamel || "",
      stock: Number(row.stock || 0),
      note: row.note || ""
    }))

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], {
      type: "application/json"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tamiya-paints.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportCSV() {
    const rows = data.map(row =>
      fieldKeys.map(key => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(",")
    )

    const csv = [fieldKeys.join(","), ...rows].join("\n")

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tamiya-paints.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(e) {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const rows = JSON.parse(text)

      if (!Array.isArray(rows)) {
        alert("JSON 格式錯誤")
        return
      }

      const payload = rows.map(row => ({
        color_group: row.color_group || "",
        acrylic: row.acrylic || "",
        acrylic_name: row.acrylic_name || "",
        lp: row.lp || "",
        lp_name: row.lp_name || "",
        enamel: row.enamel || "",
        stock: Number(row.stock || 1),
        note: row.note || ""
      }))

      const { error } = await supabase.from("paints").insert(payload)

      if (error) {
        alert("JSON 匯入失敗：" + error.message)
        return
      }

      e.target.value = ""
      load()
      alert("JSON 匯入成功")
    } catch (error) {
      alert("JSON 讀取失敗：" + error.message)
    }
  }

  function parseCSVLine(line) {
    const values = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }

    values.push(current)
    return values
  }

  async function importCSV(e) {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.trim().split(/\r?\n/)

      if (lines.length < 2) {
        alert("CSV 沒有資料")
        return
      }

      const headers = parseCSVLine(lines[0]).map(h =>
        h.replace(/^\uFEFF/, "").trim()
      )

      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row = {}

        headers.forEach((key, index) => {
          row[key] = values[index] || ""
        })

        return {
          color_group: row.color_group || "",
          acrylic: row.acrylic || "",
          acrylic_name: row.acrylic_name || "",
          lp: row.lp || "",
          lp_name: row.lp_name || "",
          enamel: row.enamel || "",
          stock: Number(row.stock || 1),
          note: row.note || ""
        }
      })

      const { error } = await supabase.from("paints").insert(rows)

      if (error) {
        alert("CSV 匯入失敗：" + error.message)
        return
      }

      e.target.value = ""
      load()
      alert("CSV 匯入成功")
    } catch (error) {
      alert("CSV 讀取失敗：" + error.message)
    }
  }

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return data

    return data.filter(row =>
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
        .includes(keyword)
    )
  }, [data, search])

  const totalStock = useMemo(() => {
    return data.reduce((sum, row) => sum + Number(row.stock || 0), 0)
  }, [data])

  return (
    <div className="app">
      <div className="container">
        <header className="pageHeader">
          <div>
            <p className="eyebrow">TAMIYA PAINT DATABASE</p>
            <h1>🎨 Tamiya 三漆系管理</h1>
            <p className="subtitle">
              手動建立 Acrylic / LP / Enamel 對照資料，並同步管理庫存。
            </p>
          </div>

          <button className="refreshButton" onClick={load}>
            重新讀取
          </button>
        </header>

        <section className="panel">
          <div className="panelTitle">
            <div>
              <h2>{editingId ? "編輯漆料資料" : "新增漆料資料"}</h2>
              <p>
                {editingId
                  ? "正在編輯既有資料，修改後請按儲存修改。"
                  : "依照三漆系母表格式手動填寫。"}
              </p>
            </div>
          </div>

          <div className="form">
            {fields.map(field => (
              <label key={field.key} className="field">
                <span>{field.label}</span>
                <input
                  name={field.key}
                  type={field.key === "stock" ? "number" : "text"}
                  min={field.key === "stock" ? "0" : undefined}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={handleChange}
                />
              </label>
            ))}

            <div className="formActions">
              <button className="primaryButton" onClick={saveData}>
                {editingId ? "儲存修改" : "新增資料"}
              </button>

              {editingId && (
                <button className="secondaryButton" onClick={cancelEdit}>
                  取消編輯
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="statCard">
            <span>總品項</span>
            <strong>{data.length}</strong>
          </div>
          <div className="statCard">
            <span>總庫存</span>
            <strong>{totalStock}</strong>
          </div>
          <div className="statCard">
            <span>目前顯示</span>
            <strong>{filtered.length}</strong>
          </div>
        </section>

        <section className="importExport">
          <label className="importButton">
            匯入 CSV
            <input type="file" accept=".csv" onChange={importCSV} hidden />
          </label>

          <label className="importButton">
            匯入 JSON
            <input type="file" accept=".json" onChange={importJSON} hidden />
          </label>

          <button onClick={exportCSV}>匯出 CSV</button>
          <button onClick={exportJSON}>匯出 JSON</button>
        </section>

        <section className="toolbar">
          <input
            className="searchInput"
            placeholder="搜尋色系、色號、名稱、備註..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="counter">
            {loading ? "讀取中..." : `顯示 ${filtered.length} / ${data.length} 筆`}
          </div>
        </section>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                {fields.map(field => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <span className={`tag ${row.color_group || "default"}`}>
                      {row.color_group || "-"}
                    </span>
                  </td>
                  <td className="code">{row.acrylic || "-"}</td>
                  <td>{row.acrylic_name || "-"}</td>
                  <td className="code">{row.lp || "-"}</td>
                  <td>{row.lp_name || "-"}</td>
                  <td className="code">{row.enamel || "-"}</td>
                  <td>
                    <div className="stockControl">
                      <button onClick={() => updateStock(row, -1)}>－</button>
                      <span className="stock">{row.stock ?? 0}</span>
                      <button onClick={() => updateStock(row, 1)}>＋</button>
                    </div>
                  </td>
                  <td>{row.note || "-"}</td>
                  <td>
                    <div className="actionGroup">
                      <button className="editButton" onClick={() => startEdit(row)}>
                        編輯
                      </button>
                      <button className="deleteButton" onClick={() => deleteRow(row.id)}>
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="emptyState">
                    目前沒有資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}