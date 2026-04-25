import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function App() {
  const [list, setList] = useState([])
  const [form, setForm] = useState({
    brand: "",
    code: "",
    name: "",
    color: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const mapped = (data || []).map((item) => ({
      id: item.id,
      brand: item.brand || "",
      code: item.acrylic || item.acrylic_code || item.code || "",
      name: item.acrylic_name || item.name || "",
      color: item.color_group || item.color || "",
      qty: Number(item.stock ?? 1)
    }))

    setList(mapped)
  }

  async function addItem() {
    if (!form.code) return

    const { error } = await supabase.from("paints").insert([
      {
        brand: form.brand,
        acrylic: form.code,
        acrylic_name: form.name,
        color_group: form.color,
        stock: 1
      }
    ])

    if (error) {
      console.error(error)
      return
    }

    setForm({
      brand: "",
      code: "",
      name: "",
      color: ""
    })

    fetchData()
  }

  async function updateQty(id, qty, delta) {
    const safeQty = Number(qty ?? 0)
    const next = Math.max(0, safeQty + delta)

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

      <div className="form">
        <input
          placeholder="廠牌"
          value={form.brand}
          onChange={(e) =>
            setForm({ ...form, brand: e.target.value })
          }
        />

        <input
          placeholder="色號 (XF-1)"
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

        <button onClick={addItem}>新增</button>
      </div>

      <div className="list">
        {list.map((item) => (
          <div className="card" key={item.id}>
            <div className="left">
              {item.brand && (
                <div className="brand">{item.brand}</div>
              )}
              <div className="title">{item.code}</div>
              <div className="sub">{item.name}</div>
              <div className="tag">{item.color}</div>
            </div>

            <div className="right">
              <button onClick={() => updateQty(item.id, item.qty, -1)}>
                -
              </button>

              <span>{item.qty}</span>

              <button onClick={() => updateQty(item.id, item.qty, 1)}>
                +
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