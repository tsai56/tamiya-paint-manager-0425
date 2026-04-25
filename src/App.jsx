import { useState } from "react";

export default function App() {
  const [rows, setRows] = useState([]);
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

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const addRow = () => {
    if (!form.acrylic) return;

    setRows([
      {
        ...form,
        id: Date.now(),
      },
      ...rows,
    ]);

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

  const updateStock = (id, delta) => {
    setRows(
      rows.map((r) =>
        r.id === id
          ? { ...r, stock: Math.max(0, r.stock + delta) }
          : r
      )
    );
  };

  const deleteRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="app">
      <h1 className="title">Tamiya 三漆系管理</h1>

      {/* 新增 */}
      <div className="card">
        <div className="form">
          <input
            placeholder="色系"
            value={form.color_group}
            onChange={(e) => handleChange("color_group", e.target.value)}
          />
          <input
            placeholder="Acrylic 色號"
            value={form.acrylic}
            onChange={(e) => handleChange("acrylic", e.target.value)}
          />
          <input
            placeholder="Acrylic 名稱"
            value={form.acrylic_name}
            onChange={(e) => handleChange("acrylic_name", e.target.value)}
          />
          <input
            placeholder="LP 色號"
            value={form.lp}
            onChange={(e) => handleChange("lp", e.target.value)}
          />
          <input
            placeholder="LP 名稱"
            value={form.lp_name}
            onChange={(e) => handleChange("lp_name", e.target.value)}
          />
          <input
            placeholder="Enamel 色號"
            value={form.enamel}
            onChange={(e) => handleChange("enamel", e.target.value)}
          />
          <input
            type="number"
            placeholder="庫存"
            value={form.stock}
            onChange={(e) =>
              handleChange("stock", Number(e.target.value))
            }
          />
          <input
            placeholder="備註"
            value={form.note}
            onChange={(e) => handleChange("note", e.target.value)}
          />

          <button className="addBtn" onClick={addRow}>
            新增資料
          </button>
        </div>
      </div>

      {/* 工具列 */}
      <div className="toolbar">
        <input placeholder="搜尋..." />
        <button>匯出 CSV</button>
        <button>匯出 JSON</button>
        <button>匯入 CSV</button>
        <button>匯入 JSON</button>
      </div>

      {/* 列表 */}
      <div className="list">
        {rows.map((row) => (
          <div className="item" key={row.id}>
            <div className="item-left">
              <div className="code">
                {row.acrylic || row.lp || row.enamel || "-"}
              </div>

              <div className="name">
                {row.acrylic_name || row.lp_name || "-"}
              </div>

              <div className="name">
                色系：{row.color_group || "-"} ｜ LP：{row.lp || "-"} ｜ Enamel：{row.enamel || "-"}
              </div>

              {row.note && (
                <div className="name">備註：{row.note}</div>
              )}

              <span className="tag">
                {row.color_group || "未分類"}
              </span>
            </div>

            <div className="item-right">
              <div className="qty">
                <button onClick={() => updateStock(row.id, -1)}>
                  -
                </button>
                <span>{row.stock}</span>
                <button onClick={() => updateStock(row.id, 1)}>
                  +
                </button>
              </div>

              <button className="editBtn">編輯</button>
              <button
                className="deleteBtn"
                onClick={() => deleteRow(row.id)}
              >
                刪除
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={{ opacity: 0.4, textAlign: "center" }}>
            尚未新增資料
          </div>
        )}
      </div>
    </div>
  );
}