import { useEffect, useState } from "react"
import { supabase } from "./supabase"

const BRANDS = [
  "Tamiya",
  "Mr.Hobby",
  "Gaia",
  "Vallejo",
  "AK Interactive",
  "Ammo by Mig",
  "Citadel",
  "Humbrol",
  "Testors",
  "Alclad II",
  "Scale75",
  "Zero Paints",
  "Mission Models",
  "Army Painter",
  "其他"
]

const EMPTY_FORM = {
  brand: "Tamiya",
  acrylic: "",
  acrylic_name: "",
  lp: "",
  lp_name: "",
  enamel: "",
  color_group: "",
  stock: 1,
  note: ""
}

export default function App() {
  const [list, setList] = useState([])
  const [keyword, setKeyword] = useState("")
  const [editingId, setEditingId] = useState(null)
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
      console.error("讀取失敗:", error)
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

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  async function handleSubmit() {
    if (!form.acrylic && !form.lp && !form.enamel && !form.acrylic_name) {
      alert("請至少輸入一個色號或名稱")
      return
    }

    const payload = {
      brand: form.brand,
      acrylic: form.acrylic,
      acrylic_name: form.acrylic_name,
      lp: form.lp,
      lp_name: form.lp_name,
      enamel: form.enamel,
      color_group: form.color_group,
      stock: Number(form.stock || 1),
      note: form.note
    }

    if (editingId) {
      const { error } = await supabase
        .from("paints")
        .update(payload)
        .eq("id", editingId)

      if (error) {
        alert(error.message)
        console.error("更新失敗:", error)
        return
      }
    } else {
      const { error } = await supabase.from("paints").insert([payload])

      if (error) {
        alert(error.message)
        console.error("新增失敗:", error)
        return
      }
    }

    resetForm()
    fetchData()
  }

  function handleEdit(item) {
    setForm({
      brand: item.brand || "Tamiya",
      acrylic: item.acrylic || "",
      acrylic_name: item.acrylic_name || "",
      lp: item.lp || "",
      lp_name: item.lp_name || "",
      enamel: item.enamel || "",
      color_group: item.color_group || "",
      stock: Number(item.stock ?? 1),
      note: item.note || ""
    })

    setEditingId(item.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function updateStock(id, currentStock, delta) {
    const nextStock = Math.max(0, Number(currentStock ?? 0) + delta)

    const { error } = await supabase
      .from("paints")
      .update({ stock: nextStock })
      .eq("id", id)

    if (error) {
      alert(error.message)
      console.error("庫存更新失敗:", error)
      return
    }

    fetchData()
  }

  async function removeItem(id) {
    if (!confirm("確定要刪除這筆資料嗎？")) return

    const { error } = await supabase
      .from("paints")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      console.error("刪除失敗:", error)
      return
    }

    fetchData()
  }

  const filteredList = list.filter((item) =>
    [
      item.brand,
      item.acrylic,
      item.acrylic_name,
      item.lp,
      item.lp_name,
      item.enamel,
      item.color_group,
      item.note
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword.toLowerCase())
  )

  const totalStock = list.reduce(
    (sum, item) => sum + Number(item.stock ?? 0),
    0
  )

  return (
    <div className="container">
      <h1>模型漆管理系統</h1>

      <div className="form">
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
          placeholder="Acrylic 色號"
          value={form.acrylic}
          onChange={(e) => updateForm("acrylic", e.target.value)}
        />

        <input
          placeholder="Acrylic 名稱"
          value={form.acrylic_name}
          onChange={(e) => updateForm("acrylic_name", e.target.value)}
        />

        <input
          placeholder="LP 色號"
          value={form.lp}
          onChange={(e) => updateForm("lp", e.target.value)}
        />

        <input
          placeholder="LP 名稱"
          value={form.lp_name}
          onChange={(e) => updateForm("lp_name", e.target.value)}
        />

        <input
          placeholder="Enamel 色號"
          value={form.enamel}
          onChange={(e) => updateForm("enamel", e.target.value)}
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

        <button onClick={handleSubmit}>
          {editingId ? "更新" : "新增"}
        </button>

        {editingId && (
          <button onClick={resetForm}>
            取消
          </button>
        )}
      </div>

      <div className="stats">
        <span>總品項 {list.length}</span>
        <span>總庫存 {totalStock}</span>
        <span>目前顯示 {filteredList.length}</span>
      </div>

      <input
        className="search"
        placeholder="搜尋廠牌 / 色號 / 名稱 / 色系 / 備註"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="list">
        {filteredList.map((item) => {
          const mainCode = item.acrylic || item.lp || item.enamel || "-"
          const mainName = item.acrylic_name || item.lp_name || "-"

          return (
            <div className="card" key={item.id}>
              <div className="left">
                {item.brand && <div className="brand">{item.brand}</div>}

                <div className="title">{mainCode}</div>
                <div className="sub">{mainName}</div>

                {item.color_group && (
                  <div className="tag">{item.color_group}</div>
                )}

                <div className="paint-lines">
                  {item.acrylic && <span>Acrylic：{item.acrylic}</span>}
                  {item.lp && <span>LP：{item.lp}</span>}
                  {item.lp_name && <span>LP 名稱：{item.lp_name}</span>}
                  {item.enamel && <span>Enamel：{item.enamel}</span>}
                </div>

                {item.note && <div className="note">備註：{item.note}</div>}
              </div>

              <div className="right">
                <button onClick={() => updateStock(item.id, item.stock, -1)}>
                  -
                </button>

                <span>{Number(item.stock ?? 0)}</span>

                <button onClick={() => updateStock(item.id, item.stock, 1)}>
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
          )
        })}
      </div>
    </div>
  )
}