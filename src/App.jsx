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
    const { data, error } = await supabase
      .from("paints")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setList(data || [])
  }

  function updateForm(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  async function addItem() {
    if (!form.code) {
      alert("請輸入色號")
      return
    }

    const { error } = await supabase.from("paints").insert([
      {
        brand: form.brand,
        code: form.code,
        name: form.name,
        color_group: form.color_group,
        stock: Number(form.stock || 1),
        note: form.note
      }
    ])

    if (error) {
      alert(error.message)
      return
    }

    setForm(EMPTY_FORM)
    fetchData()
  }

  async function updateStock(id, stock, delta) {
    const nextStock = Math.max(0, Number(stock ?? 0) + delta)

    const { error } = await supabase
      .from("paints")
      .update({ stock: nextStock })
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  async function removeItem(id) {
    if (!confirm("確定刪除？")) return

    const { error } = await supabase
      .from("paints")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchData()
  }

  const filteredList = list.filter((item) =>
    `${item.brand} ${item.code} ${item.name} ${item.color_group} ${item.note}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
  )

  const totalStock = list.reduce(
    (sum, item) => sum + Number(item.stock ?? 0),
    0
  )

  return (
    <div className="container">
      <h1 className="titleMain">模型漆管理系統</h1>

      <div className="formGrid">
        <select
          value={form.brand}
          onChange={(e) => updateForm("brand", e.target.value)}
        >
          {BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <input
          placeholder="色號"
          value={form.code}
          onChange={(e) => updateForm("code", e.target.value)}
        />

        <input
          placeholder="名稱"
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
        />

        <input
          placeholder="色系"
          value={form.color_group}
          onChange={(e) => updateForm("color_group", e.target.value)}
        />

        <input
          type="number"
          placeholder="庫存"
          value={form.stock}
          onChange={(e) => updateForm("stock", Number(e.target.value))}
        />

        <input
          placeholder="備註"
          value={form.note}
          onChange={(e) => updateForm("note", e.target.value)}
        />

        <button onClick={addItem}>＋ 新增</button>
      </div>

      <div className="stats">
        <div className="statBox">總品項 {list.length}</div>
        <div className="statBox">總庫存 {totalStock}</div>
        <div className="statBox">顯示 {filteredList.length}</div>
      </div>

      <div className="searchBar">
        <input
          placeholder="搜尋 廠牌 / 色號 / 名稱 / 色系 / 備註"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="list">
        {filteredList.map((item) => (
          <div className="card" key={item.id}>
            <div className="left">
              {item.brand && <div className="brand">{item.brand}</div>}

              <div className="code">{item.code}</div>

              {item.name && <div className="name">{item.name}</div>}

              {item.color_group && (
                <div className="tag">{item.color_group}</div>
              )}

              {item.note && (
                <div className="note">備註：{item.note}</div>
              )}
            </div>

            <div className="right">
              <div className="stock">{Number(item.stock ?? 0)}</div>

              <div className="btns">
                <button onClick={() => updateStock(item.id, item.stock, -1)}>
                  -
                </button>

                <button onClick={() => updateStock(item.id, item.stock, 1)}>
                  +
                </button>
              </div>

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