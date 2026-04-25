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
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

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

  useEffect(() => {
    load()
  }, [])

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
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

  async function saveData() {
    if (!form.acrylic && !form.lp && !form.enamel) {
      alert("至少填一個色號，例如 Acrylic / LP / Enamel")
      return
    }

    const payload = {
      ...form,
      stock: Number(form.stock || 1)
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

    setEditingId(null)
    setForm(emptyForm)
    load()
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
    if (!data.length) {
      alert("目前沒有資料可匯出")
      return
    }

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
    if (!data.length) {
      alert("目前沒有資料可匯出")
      return
    }

    const rows = data.map(row =>
      fields
        .map(key => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )

    const csv = [fields.join(","), ...rows].join("\n")

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
        alert("JSON 格式錯誤，必須是陣列")
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

      alert("JSON 匯入成功")
      e.target.value = ""
      load()
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

      alert("CSV 匯入成功")
      e.target.value = ""
      load()
    } catch (error) {
      alert("CSV 讀取失敗：" + error.message)
    }
  }

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return data

    return data.filter(row => {
      const text = [
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

      return text.includes(keyword)
    })
  }, [data, search])

  const totalStock = useMemo(() => {
    return data.reduce((sum, row) => sum + Number(row.stock || 0), 0)
  }, [data])

  return (
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
          <h2>{editingId ? "編輯漆料資料" : "新增漆料資料"}</h2>
          <p>
            {editingId
              ? "正在編輯既有資料，修改後請按儲存修改。"
              : "依照三漆系母表格式手動填寫，每筆資料會同步到 Supabase。"}
          </p>
        </div>

        <div className="form">
          <input
            name="color_group"
            placeholder="色系，例如：黑色"
            value={form.color_group}
            onChange={handleChange}
          />
          <input
            name="acrylic"
            placeholder="Acrylic，例如：XF-85"
            value={form.acrylic}
            onChange={handleChange}
          />
          <input
            name="acrylic_name"
            placeholder="Acrylic 官方名稱"
            value={form.acrylic_name}
            onChange={handleChange}
          />
          <input
            name="lp"
            placeholder="LP，例如：LP-65"
            value={form.lp}
            onChange={handleChange}
          />
          <input
            name="lp_name"
            placeholder="LP 官方名稱"
            value={form.lp_name}
            onChange={handleChange}
          />
          <input
            name="enamel"
            placeholder="Enamel，例如：XF-85"
            value={form.enamel}
            onChange={handleChange}
          />
          <input
            name="stock"
            type="number"
            min="0"
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

          <button onClick={saveData}>
            {editingId ? "💾 儲存修改" : "＋ 新增資料"}
          </button>

          {editingId && (
            <button className="cancelButton" onClick={cancelEdit}>
              取消編輯
            </button>
          )}
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
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="counter">
          {loading ? "讀取中..." : `顯示 ${filtered.length} / ${data.length} 筆`}
        </div>
      </section>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>色系</th>
              <th>Acrylic</th>
              <th>Acrylic 官方名稱</th>
              <th>LP</th>
              <th>LP 官方名稱</th>
              <th>Enamel</th>
              <th>庫存</th>
              <th>備註</th>
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
  )
}