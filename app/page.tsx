"use client";

import { useState } from "react";

// プロンプト入力と結果表示
export default function Page() {
  const [result,setResult] = useState("");

  const send = async () => {
    const r = await fetch("/api/chat",{ method: "POST"});
    const data = await r.json();
    setResult(data.response);
  };

  return(
    <main style={{padding: 24}}>
      <button onClick={send}>送信</button>
      <div style={{ marginTop: 16 }}>結果: {result}</div>
    </main>
  )
}