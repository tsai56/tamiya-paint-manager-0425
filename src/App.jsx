import { useEffect, useState } from "react";
import "./style.css";

export default function App() {
  const [data, setData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState({
    color_group: "",
    acrylic: "",
    acrylic_name: "",
    lp: "",
    lp_name: "",
    enamel: "",
    stock: 1,
    note: "",
  });
  const [editId, setEditId] = useState(null);

  // 新增 / 更新
  const saveData = () => {
    if (!form.acrylic && !form.enamel) return alert("請輸入色號");

    if (editId) {
      setData((prev) =>
        prev.map((d) => (d.id === editId ? { ...form, id: editId } : d))
      );
      setEditId(null);
    } else {
      setData((prev) => [...prev, { ...form, id: Date.now() }]);
    }

    setForm({
      color_group: "",
      acrylic: "",
      acrylic_name: "",
      lp: "",
      lp_name: "",
      enamel: "",
      stock: 1,
      note: "",
    });
  };

  // 刪除
  const deleteRow = (id) => {
    setData((prev) => prev.filter((d) => d.id !== id));
  };

  // 編輯
  const startEdit = (row) => {
    setForm(row);
    setEditId(row.id);
  };

  // 庫存調整
  const updateStock = (id, delta) => {
    setData((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, stock: Math.max(0, d.stock + delta) } : d
      )
    );
  };

  // 搜尋
  const filtered = data.filter((d) =>
    Object.values(d).join(" ").toLowerCase().includes(keyword.toLowerCase())
  );

  // 匯出 JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tamiya.json";
    a.click();
  };

  // 匯入 JSON
  const importJSON = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const json = JSON.parse(reader.result);
      setData(json);
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <h1>🎨 Tamiya 三漆系管理</h1>

      {/* 新增區 */}
      <div className="card">
        <div className="form">
          {Object.keys(form).map((k) => (
            <input
              key={k}
              placeholder={k}
              value={form[k]}
              onChange={(e) =>
                setForm({ ...form, [k]: e.target.value })
              }
            />
          ))}
        </div>
        <button className="primary" onClick={saveData}>
          {editId ? "更新資料" : "新增資料"}
        </button>
      </div>

      {/* 工具列 */}
      <div className="toolbar">
        <input
          placeholder="搜尋..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button onClick={exportJSON}>匯出 JSON</button>
        <label className="upload">
          匯入 JSON
          <input type="file" onChange={importJSON} hidden />
        </label>
      </div>

      {/* 表格 */}
      <div className="table">
        {filtered.map((row) => (
          <div className="row" key={row.id}>
            <div className="info">
              <b>{row.acrylic || row.enamel}</b>
              <span>{row.acrylic_name || "-"}</span>
              <small>{row.note}</small>
            </div>

            <div className="stock">
              <button onClick={() => updateStock(row.id, -1)}>-</button>
              <span>{row.stock}</span>
              <button onClick={() => updateStock(row.id, 1)}>+</button>
            </div>

            <div className="actions">
              <button onClick={() => startEdit(row)}>編輯</button>
              <button className="danger" onClick={() => deleteRow(row.id)}>
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}