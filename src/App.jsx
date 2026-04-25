import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import "./App.css"

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

  async function load() {
    const { data } = await supabase.from("paints").select("*").order("created_at", { ascending: false })
    setData(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function addData() {
    await supabase.from("paints").insert([form])
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
    load()
  }

  async function deleteRow(id) {
    await supabase.from("paints").delete().eq("id", id)
    load()
  }

  return (
    <div className="container">
      <h1>🎨 Tamiya 三漆系管理</h1>

      {/* 新增區 */}
      <div className="form">
        <input name="color_group" placeholder="色系" value={form.color_group} onChange={handleChange} />
        <input name="acrylic" placeholder="Acrylic" value={form.acrylic} onChange={handleChange} />
        <input name="acrylic_name" placeholder="Acrylic 名稱" value={form.acrylic_name} onChange={handleChange} />
        <input name="lp" placeholder="LP" value={form.lp} onChange={handleChange} />
        <input name="lp_name" placeholder="LP 名稱" value={form.lp_name} onChange={handleChange} />
        <input name="enamel" placeholder="Enamel" value={form.enamel} onChange={handleChange} />
        <input name="stock" type="number" placeholder="庫存" value={form.stock} onChange={handleChange} />
        <input name="note" placeholder="備註" value={form.note} onChange={handleChange} />

        <button onClick={addData}>新增</button>
      </div>

      {/* 表格 */}
      <table>
        <thead>
          <tr>
            <th>色系</th>
            <th>Acrylic</th>
            <th>名稱</th>
            <th>LP</th>
            <th>LP名稱</th>
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
              <td>{row.stock}</td>
              <td>{row.note}</td>
              <td>
                <button onClick={() => deleteRow(row.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}