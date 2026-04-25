import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const BRANDS = ["Tamiya", "Mr.Hobby", "Gaia", "Vallejo", "其他"]

const EMPTY_FORM = {
  brand: "Tamiya",
  code: "",
  name: "",
  color_group: "",
  stock: 1,
  note: ""
}

export default function App() {
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)

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
    if (!form.code) return alert("請輸入色號")

    await supabase.from("paints").insert([form])
    setForm(EMPTY_FORM)
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
    if (!confirm("確定刪除？")) return
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  const filtered = list.filter((p) =>
    `${p.brand} ${p.code} ${p.name} ${p.color_group} ${p.note}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
  )

  const total = list.length
  const stock = list.reduce((s, i) => s + (i.stock || 0), 0)

  return (
    <div className="container">
      <h1 className="titleMain">模型漆管理系統</h1>

      {/* 表單 */}
      <div className="formGrid">
        <select
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
        >
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>

        <input
          placeholder="色號"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />

        <input
          placeholder="名稱"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="色系"
          value={form.color_group}
          onChange={(e) =>
            setForm({ ...form, color_group: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="庫存"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: Number(e.target.value) })
          }
        />

        <input
          placeholder="備註"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <button onClick={addItem}>＋ 新增</button>
      </div>

      {/* 統計 */}
      <div className="stats">
        <div className="statBox">總品項 {total}</div>
        <div className="statBox">總庫存 {stock}</div>
        <div className="statBox">顯示 {filtered.length}</div>
      </div>

      {/* 搜尋 */}
      <input
        className="search"
        placeholder="搜尋 廠牌 / 色號 / 名稱 / 色系 / 備註"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* 卡片 */}
      <div className="list">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <div className="leftBar"></div>

            <div className="left">
              <div className="brand">{p.brand}</div>
              <div className="code">{p.code}</div>
              <div className="name">{p.name}</div>

              {p.color_group && (
                <div className="tag">{p.color_group}</div>
              )}

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