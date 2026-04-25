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

export default function App() {
  const [data, setData] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState("")

  async function load() {
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert("讀取失敗：" + error.message)
      return
    }

    setData(data || [])
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

  async function addData() {
    if (!form.acrylic && !form.lp && !form.enamel) {
      alert("至少填一個色號，例如 Acrylic / LP / Enamel")
      return
    }

    const payload = {
      ...form,
      stock: Number(form.stock || 1)
    }

    const { error } = await supabase
      .from("paints")
      .insert([payload])

    if (error) {
      alert("新增失敗：" + error.message)
      return
    }

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

  return (
    <div className="container">
      <header className="pageHeader">
        <p className="eyebrow">TAMIYA PAINT DATABASE</p>
        <h1>🎨 Tamiya 三漆系管理</h1>
        <p className="subtitle">
          手動建立 Acrylic / LP / Enamel 對照資料，並同步管理庫存。
        </p>
      </header>

      <section className="panel">
        <div className="panelTitle">
          <h2>新增漆料資料</h2>
          <p>依照 Notion 三漆系母表格式手動填寫</p>
        </div>

        <div className="form">
          <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
          <input name="acrylic" placeholder="Acrylic" value={form.acrylic} onChange={handleChange} />
          <input name="acrylic_name" placeholder="Acrylic 官方名稱" value={form.acrylic_name} onChange={handleChange} />
          <input name="lp" placeholder="LP" value={form.lp} onChange={handleChange} />
          <input name="lp_name" placeholder="LP 官方名稱" value={form.lp_name} onChange={handleChange} />
          <input name="enamel" placeholder="Enamel" value={form.enamel} onChange={handleChange} />
          <input name="stock" type="number" placeholder="庫存" value={form.stock} onChange={handleChange} />
          <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />

          <button onClick={addData}>＋ 新增資料</button>
        </div>
      </section>

      <section className="toolbar">
        <input
          className="searchInput"
          placeholder="搜尋色系、色號、名稱、備註..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="counter">
          顯示 {filtered.length} / {data.length} 筆
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
                  <span className="stock">{row.stock}</span>
                </td>
                <td>{row.note || "-"}</td>
                <td>
                  <button className="deleteButton" onClick={() => deleteRow(row.id)}>
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}