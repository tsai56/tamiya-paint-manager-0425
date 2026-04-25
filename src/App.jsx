import { useState } from "react";

export default function App() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    color: "",
  });

  const addItem = () => {
    if (!form.code) return;
    setList([...list, { ...form, qty: 1 }]);
    setForm({ code: "", name: "", color: "" });
  };

  const updateQty = (i, delta) => {
    const newList = [...list];
    newList[i].qty = Math.max(0, newList[i].qty + delta);
    setList(newList);
  };

  const removeItem = (i) => {
    setList(list.filter((_, index) => index !== i));
  };

  return (
    <div className="container">
      <h1>Tamiya 三漆系管理</h1>

      {/* 新增區 */}
      <div className="form">
        <input
          placeholder="色號 (XF-1)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <input
          placeholder="名稱"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="顏色"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
        <button onClick={addItem}>新增</button>
      </div>

      {/* 清單 */}
      <div className="list">
        {list.map((item, i) => (
          <div className="card" key={i}>
            <div className="left">
              <div className="title">{item.code}</div>
              <div className="sub">{item.name}</div>
              <div className="tag">{item.color}</div>
            </div>

            <div className="right">
              <button onClick={() => updateQty(i, -1)}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(i, 1)}>+</button>
              <button className="delete" onClick={() => removeItem(i)}>
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}