"use client";

import { useState } from "react";

// メッセージの型定義
type Message = {
  role: "user" | "assistant";
  content: string;
};

// プロンプト入力と送信
export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // 配列で会話履歴を管理
  const [isLoading, setIsLoading] = useState(false);

  const send = async () => {
    // プロンプトが未入力なら何もしない
    if (!prompt.trim()) return;

    setIsLoading(true);

    // 1. ユーザーメッセージを配列に追加
    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);

    // 2. 入力欄をクリア
    setPrompt("");

    // 3. AIの返答用の空メッセージを追加
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ストリーミングレスポンスを処理
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is null");
      }

      // ストリームからデータを読み取る
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // チャンクをデコードして最後のメッセージ（AI）に追加
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          // オブジェクトも新しく作成（元のオブジェクトを変更しない）
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunk,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      // エラーメッセージを最後のメッセージに設定
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: "エラーが発生しました",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 改行は送信から除外
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>Ollama Chat</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メッセージを入力してください..."
        style={{
          width: "100%",
          minHeight: 100,
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          resize: "vertical",
        }}
        disabled={isLoading}
      />
      <button
        onClick={send}
        disabled={isLoading || !prompt.trim()}
        style={{
          marginTop: 12,
          padding: "10px 24px",
          fontSize: 16,
          borderRadius: 8,
          border: "none",
          backgroundColor: isLoading || !prompt.trim() ? "#ccc" : "#0070f3",
          color: "#fff",
          cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "送信中..." : "送信"}
      </button>
      {/* メッセージ履歴の表示 */}
      <div style={{ marginTop: 24 }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: message.role === "user" ? "#e3f2fd" : "#f5f5f5",
              borderRadius: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>{message.role === "user" ? "あなた" : "AI"}:</strong>
            <p style={{ marginTop: 8 }}>{message.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}