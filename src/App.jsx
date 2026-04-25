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
      color_group: form.color_group || "",
      acrylic: form.acrylic || "",
      acrylic_name: form.acrylic_name || "",
      lp: form.lp || "",
      lp_name: form.lp_name || "",
      enamel: form.enamel || "",
      stock: Number(form.stock || 1),
      note: form.note || ""
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

    window.scrollTo({ top: 0, behavior: "smooth" })
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
    const cleanRows = rows.map(row => ({
      color_group: row.color_group || "",
      acrylic: row.acrylic || "",
      acrylic_name: row.acrylic_name || "",
      lp: row.lp || "",
      lp_name: row.lp_name || "",
      enamel: row.enamel || "",
      stock: Number(row.stock || 0),
      note: row.note || ""
    }))

    const blob = new Blob([JSON.stringify(cleanRows, null, 2)], {
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
    const headers = [
      "色系",
      "Acrylic 色號",
      "Acrylic 名稱",
      "LP 色號",
      "LP 名稱",
      "Enamel 色號",
      "庫存",
      "備註"
    ]

    const csvRows = rows.map(row => [
      row.color_group || "",
      row.acrylic || "",
      row.acrylic_name || "",
      row.lp || "",
      row.lp_name || "",
      row.enamel || "",
      row.stock || 0,
      row.note || ""
    ])

    const csv = [
      headers.join(","),
      ...csvRows.map(row =>
        row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
    ].join("\n")

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
      const json = JSON.parse(text)

      if (!Array.isArray(json)) {
        alert("JSON 格式錯誤，必須是陣列")
        return
      }

      const payload = json.map(row => ({
        color_group: row.color_group || row["色系"] || "",
        acrylic: row.acrylic || row["Acrylic 色號"] || row["Acrylic"] || "",
        acrylic_name: row.acrylic_name || row["Acrylic 名稱"] || row["Acrylic 官方名稱"] || "",
        lp: row.lp || row["LP 色號"] || row["LP"] || "",
        lp_name: row.lp_name || row["LP 名稱"] || row["LP 官方名稱"] || "",
        enamel: row.enamel || row["Enamel 色號"] || row["Enamel"] || "",
        stock: Number(row.stock || row["庫存"] || 1),
        note: row.note || row["備註"] || ""
      }))

      const { error } = await supabase.from("paints").insert(payload)

      if (error) {
        alert("JSON 匯入失敗：" + error.message)
        return
      }

      e.target.value = ""
      fetchData()
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
      const lines = text
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)

      if (lines.length < 2) {
        alert("CSV 沒有資料")
        return
      }

      const headers = parseCSVLine(lines[0]).map(h =>
        h.replace(/^\uFEFF/, "").trim()
      )

      const payload = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row = {}

        headers.forEach((header, index) => {
          row[header] = (values[index] || "").trim()
        })

        return {
          color_group: row.color_group || row["色系"] || "",
          acrylic: row.acrylic || row["Acrylic 色號"] || row["Acrylic"] || "",
          acrylic_name: row.acrylic_name || row["Acrylic 名稱"] || row["Acrylic 官方名稱"] || "",
          lp: row.lp || row["LP 色號"] || row["LP"] || "",
          lp_name: row.lp_name || row["LP 名稱"] || row["LP 官方名稱"] || "",
          enamel: row.enamel || row["Enamel 色號"] || row["Enamel"] || "",
          stock: Number(row.stock || row["庫存"] || 1),
          note: row.note || row["備註"] || ""
        }
      })

      const cleanPayload = payload.filter(row =>
        row.color_group ||
        row.acrylic ||
        row.acrylic_name ||
        row.lp ||
        row.lp_name ||
        row.enamel ||
        row.note
      )

      if (!cleanPayload.length) {
        alert("沒有可匯入的有效資料，請確認 CSV 欄位名稱")
        return
      }

      const { error } = await supabase
        .from("paints")
        .insert(cleanPayload)

      if (error) {
        alert("CSV 匯入失敗：" + error.message)
        return
      }

      e.target.value = ""
      fetchData()
    } catch (error) {
      alert("CSV 讀取失敗：" + error.message)
    }
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

  const totalStock = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0)

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">TAMIYA PAINT MANAGER</p>
          <h1>🎨 Tamiya 三漆系管理</h1>
          <p className="subtitle">
            管理 Acrylic、LP、Enamel 對照與庫存，快速新增、查詢、匯入與匯出。
          </p>
        </div>

        <button className="refreshBtn" onClick={fetchData}>
          重新讀取
        </button>
      </header>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>{editId ? "編輯漆料" : "新增漆料"}</h2>
            <p>{editId ? "修改完成後按更新資料" : "手動填入欄位，資料會同步到 Supabase"}</p>
          </div>
        </div>

        <div className="formGrid">
          <input name="color_group" placeholder="色系，例如：黑色" value={form.color_group} onChange={handleChange} />
          <input name="acrylic" placeholder="Acrylic 色號，例如：XF-1" value={form.acrylic} onChange={handleChange} />
          <input name="acrylic_name" placeholder="Acrylic 名稱，例如：Flat Black" value={form.acrylic_name} onChange={handleChange} />
          <input name="lp" placeholder="LP 色號" value={form.lp} onChange={handleChange} />
          <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
          <input name="enamel" placeholder="Enamel 色號" value={form.enamel} onChange={handleChange} />
          <input name="stock" type="number" min="0" placeholder="庫存" value={form.stock} onChange={handleChange} />
          <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />
        </div>

        <div className="formActions">
          <button className="primaryBtn" onClick={saveData}>
            {editId ? "更新資料" : "新增資料"}
          </button>

          {editId && (
            <button className="ghostBtn" onClick={() => {
              setEditId(null)
              setForm(emptyForm)
            }}>
              取消編輯
            </button>
          )}
        </div>
      </section>

      <section className="stats">
        <div className="statCard">
          <span>總品項</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="statCard">
          <span>總庫存</span>
          <strong>{totalStock}</strong>
        </div>
        <div className="statCard">
          <span>目前顯示</span>
          <strong>{filteredRows.length}</strong>
        </div>
      </section>

      <section className="tools">
        <input
          className="search"
          placeholder="搜尋色系、色號、名稱、備註..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={exportCSV}>匯出 CSV</button>
        <button onClick={exportJSON}>匯出 JSON</button>

        <label>
          匯入 CSV
          <input type="file" accept=".csv" onChange={importCSV} hidden />
        </label>

        <label>
          匯入 JSON
          <input type="file" accept=".json" onChange={importJSON} hidden />
        </label>
      </section>

      <section className="list">
        {filteredRows.map(row => (
          <article className="paintCard" key={row.id}>
            <div className="paintLeft">
              <div className="codeBadge">
                {row.acrylic || row.lp || row.enamel || "?"}
              </div>

              <div>
                <div className="paintTitle">
                  {row.acrylic || row.lp || row.enamel || "未填色號"}
                </div>

                {(row.acrylic_name || row.lp_name) && (
                  <div className="paintName">
                    {row.acrylic_name || row.lp_name}
                  </div>
                )}

                <div className="paintMeta">
                  {row.color_group && (
                    <span className={`colorTag ${row.color_group}`}>
                      {row.color_group}
                    </span>
                  )}

                  {row.lp && <span>LP：{row.lp}</span>}
                  {row.enamel && <span>Enamel：{row.enamel}</span>}
                  {row.note && <span>備註：{row.note}</span>}
                </div>
              </div>
            </div>

            <div className="stockBox">
              <button onClick={() => updateStock(row, -1)}>－</button>
              <strong>{row.stock}</strong>
              <button onClick={() => updateStock(row, 1)}>＋</button>
            </div>

            <div className="cardActions">
              <button onClick={() => startEdit(row)}>編輯</button>
              <button className="dangerBtn" onClick={() => deleteRow(row.id)}>
                刪除
              </button>
            </div>
          </article>
        ))}

        {filteredRows.length === 0 && (
          <div className="empty">
            目前沒有資料
          </div>
        )}
      </section>
    </div>
  )
}