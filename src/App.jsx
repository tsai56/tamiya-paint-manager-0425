<div className="app">
  <h1 className="title">Tamiya 三漆系管理</h1>

  <div className="card">
    <div className="form">
      {/* 你的 input */}
      <input placeholder="色系" />
      <input placeholder="Acrylic 色號" />
      <input placeholder="Acrylic 名稱" />
      <input placeholder="LP 色號" />
      <input placeholder="LP 名稱" />
      <input placeholder="Enamel 色號" />
      <input placeholder="庫存" />
      <input placeholder="備註" />

      <button className="addBtn">新增資料</button>
    </div>
  </div>

  <div className="toolbar">
    <input placeholder="搜尋..." />
    <button>匯出 CSV</button>
    <button>匯出 JSON</button>
    <button>匯入 CSV</button>
    <button>匯入 JSON</button>
  </div>

  <div className="list">
    {rows.map(row => (
      <div className="item" key={row.id}>
        <div className="item-left">
          <div className="code">{row.acrylic || "-"}</div>
          <div className="name">{row.acrylic_name || "-"}</div>
          <span className="tag">{row.color_group || "-"}</span>
        </div>

        <div className="item-right">
          <div className="qty">
            <button>-</button>
            <span>{row.stock}</span>
            <button>+</button>
          </div>

          <button className="editBtn">編輯</button>
          <button className="deleteBtn">刪除</button>
        </div>
      </div>
    ))}
  </div>
</div>