import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function parsePaint(input) {
  const text = input.toUpperCase()

  const match = text.match(/(XF|X|LP)-?\s?(\d+)/)
  const code = match ? `${match[1]}-${match[2]}` : input

  let series = "acrylic"
  if (code.startsWith("LP")) series = "lp"
  if (code.startsWith("X-")) series = "enamel"

  let name = input
    .replace(/TAMIYA/i, "")
    .replace(code, "")
    .trim()

  let color = "未分類"
  if (/黑|BLACK/.test(input)) color = "黑色"
  if (/白|WHITE/.test(input)) color = "白色"
  if (/銀|SILVER|CHROME/.test(input)) color = "金屬"
  if (/綠|GREEN/.test(input)) color = "綠色"

  return { code, series, name, color }
}

export default function App() {
  const [paints, setPaints] = useState([])
  const [input, setInput] = useState("")

  async function load() {
    const { data } = await supabase.from("paints").select("*")
    setPaints(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd() {
    if (!input) return

    const p = parsePaint(input)

    await supabase.from("paints").insert([
      {
        code: p.code,
        name: p.name,
        series: p.series,
        color: p.color,
        stock: 1,
      },
    ])

    setInput("")
    load()
  }

  async function updateStock(id, val) {
    await supabase
      .from("paints")
      .update({ stock: val })
      .eq("id", id)
    load()
  }

  async function remove(id) {
    await supabase.from("paints").delete().eq("id", id)
    load()
  }

  return (
    <div className="container">
      <h1>🎨 Tamiya Paint Manager</h1>

      <div className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="貼上：TAMIYA XF-85 橡膠黑"
        />
        <button onClick={handleAdd}>＋ 新增</button>
      </div>

      <div className="stats">
        <div>總品項 {paints.length}</div>
        <div>總庫存 {paints.reduce((a, b) => a + b.stock, 0)}</div>
      </div>

      {paints.map((p) => (
        <div className="card" key={p.id}>
          <div className="left">
            <div className="code">{p.code}</div>
            <div className="tag">{p.series}</div>
          </div>

          <div className="center">
            <h3>{p.code} {p.name}</h3>
            <p>色系：{p.color}</p>
          </div>

          <div className="right">
            <button onClick={() => updateStock(p.id, p.stock - 1)}>-</button>
            <span>{p.stock}</span>
            <button onClick={() => updateStock(p.id, p.stock + 1)}>+</button>
            <button className="delete" onClick={() => remove(p.id)}>刪除</button>
          </div>
        </div>
      ))}
    </div>
  )
}