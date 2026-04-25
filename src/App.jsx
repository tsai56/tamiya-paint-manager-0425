import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const BRANDS = [
  "Tamiya",
  "Mr.Hobby",
  "Gaia",
  "Vallejo",
  "AK",
  "Ammo",
  "Citadel",
  "其他"
]

export default function App() {
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    brand: "Tamiya",
    code: "",
    name: "",
    color: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    const mapped = (data || []).map((item) => ({
      id: item.id,
      brand: item.brand || "",
      code: item.acrylic || "",
      name: item.acrylic_name || "",
      color: item.color_group || "",
      qty: Number(item.stock ?? 1)
    }))

    setList(mapped)
  }

  // 🔥 新增 / 更新 共用
  async function handleSubmit() {
    if (!form.code) return

    if (editingId) {
      // 更新
      await supabase
        .from("paints")
        .update({
          brand: form.brand,
          acrylic: form.code,
          acrylic_name: form.name,
          color_group: form.color
        })
        .eq("id", editingId)
    } else {
      // 新增
      await supabase.from("paints").insert([
        {
          brand: form.brand,
          acrylic: form.code,
          acrylic_name: form.name,
          color_group: form.color,
          stock: 1
        }
      ])
    }

    resetForm()
    fetchData()
  }

  function resetForm() {
    setForm({
      brand: "Tamiya",
      code: "",
      name: "",
      color: ""
    })
    setEditingId(null)
  }

  // 🔥 點擊編輯
  function handleEdit(item) {
    setForm({
      brand: item.brand,
      code: item.code,
      name: item.name,
      color: item.color
    })
    setEditingId(item.id)
  }

  async function updateQty(id, qty, delta) {
    const next = Math.max(0, Number(qty) + delta)

    await supabase
      .from("paints")
      .update({ stock: next })
      .eq("id", id)

    fetchData()
  }

  async function removeItem(id) {
    await supabase.from("paints").delete().eq("id", id)
    fetchData()
  }

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      {/* 表單 */}
      <div className="form">
        <select
          value={form.brand}
          onChange={(e) =>
            setForm({ ...form, brand: e.target.value })
          }
        >
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>

        <input
          placeholder="色號"
          value={form.code}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value })
          }
        />

        <input
          placeholder="名稱"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="顏色"
          value={form.color}
          onChange={(e) =>
            setForm({ ...form, color: e.target.value })
          }
        />

        <button onClick={handleSubmit}>
          {editingId ? "更新" : "新增"}
        </button>

        {editingId && (
          <button onClick={resetForm}>
            取消
          </button>
        )}
      </div>

      {/* 搜尋 */}
      <input
        className="search"
        placeholder="搜尋"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {/* 清單 */}
      <div className="list">
        {list
          .filter((item) =>
            `${item.brand} ${item.code} ${item.name} ${item.color}`
              .toLowerCase()
              .includes(keyword.toLowerCase())
          )
          .map((item) => (
            <div className="card" key={item.id}>
              <div className="left">
                <div className="brand">{item.brand}</div>
                <div className="title">{item.code}</div>
                <div className="sub">{item.name}</div>
                {item.color && (
                  <div className="tag">{item.color}</div>
                )}
              </div>

              <div className="right">
                <button onClick={() => updateQty(item.id, item.qty, -1)}>
                  -
                </button>

                <span>{item.qty}</span>

                <button onClick={() => updateQty(item.id, item.qty, 1)}>
                  +
                </button>

                <button onClick={() => handleEdit(item)}>
                  編輯
                </button>

                <button
                  className="delete"
                  onClick={() => removeItem(item.id)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}