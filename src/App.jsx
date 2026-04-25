import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const BRANDS = ["Tamiya", "Mr.Hobby", "Gaia", "Vallejo", "其他"]

export default function App() {
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState("")

  const [form, setForm] = useState({
    brand: "Tamiya",
    acrylic: "",
    acrylic_name: "",
    lp: "",
    lp_name: "",
    enamel: "",
    note: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from("paints")
      .select("*")
      .order("created_at", { ascending: false })

    setList(data || [])
  }

  async function addItem() {
    if (!form.acrylic) return

    await supabase.from("paints").insert([
      {
        ...form,
        stock: 1
      }
    ])

    setForm({
      brand: "Tamiya",
      acrylic: "",
      acrylic_name: "",
      lp: "",
      lp_name: "",
      enamel: "",
      note: ""
    })

    fetchData()
  }

  async function updateStock(id, stock, delta) {
    await supabase
      .from("paints")
      .update({ stock: Math.max(0, stock + delta) })
      .eq("id", id)

    fetchData()
  }

  async function removeItem(id) {
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  const filtered = list.filter((p) =>
    `${p.acrylic} ${p.acrylic_name} ${p.lp} ${p.enamel}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
  )

  const total = list.length
  const stock = list.reduce((sum, i) => sum + (i.stock || 0), 0)

  return (
    <div className="container">
      <h1>模型漆管理系統</h1>

      {/* 快速新增 */}
      <div className="quick">
        <input
          placeholder="貼上色號或名稱"
          value={form.acrylic}
          onChange={(e) => setForm({ ...form, acrylic: e.target.value })}
        />
        <button onClick={addItem}>＋ 新增</button>
      </div>

      {/* 統計 */}
      <div className="stats">
        <div>總品項 {total}</div>
        <div>總庫存 {stock}</div>
        <div>目前顯示 {filtered.length}</div>
      </div>

      {/* 搜尋 */}
      <input
        className="search"
        placeholder="搜尋色號、名稱..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* 清單 */}
      <div className="list">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <div className="left">
              <div className="code">{p.acrylic}</div>
              <div className="name">{p.acrylic_name}</div>

              <div className="tags">
                {p.acrylic && <span>Acrylic: {p.acrylic}</span>}
                {p.lp && <span>LP: {p.lp}</span>}
                {p.enamel && <span>Enamel: {p.enamel}</span>}
              </div>

              {p.note && <div className="note">{p.note}</div>}
            </div>

            <div className="right">
              <div className="stock">{p.stock}</div>

              <div className="btns">
                <button onClick={() => updateStock(p.id, p.stock, -1)}>
                  -
                </button>
                <button onClick={() => updateStock(p.id, p.stock, 1)}>
                  +
                </button>
              </div>

              <button className="delete" onClick={() => removeItem(p.id)}>
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}