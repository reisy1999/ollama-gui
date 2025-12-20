"use client";

import { useState, useRef, useEffect } from "react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null); // 自動スクロール用

  // メッセージが更新されたら最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Ollama Chat</h1>
      </div>

      {/* メッセージエリア */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: 12,
                backgroundColor: message.role === "user" ? "#0084ff" : "#fff",
                color: message.role === "user" ? "#ffffff" : "#000000",
                borderRadius: 18,
                whiteSpace: "pre-wrap",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        {/* 自動スクロール用の要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力してください..."
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              padding: 12,
              fontSize: 16,
              borderRadius: 22,
              border: "1px solid #e0e0e0",
              resize: "none",
              outline: "none",
            }}
            disabled={isLoading}
          />
          <button
            onClick={send}
            disabled={isLoading || !prompt.trim()}
            style={{
              padding: "0 24px",
              fontSize: 16,
              borderRadius: 22,
              border: "none",
              backgroundColor: isLoading || !prompt.trim() ? "#ccc" : "#0084ff",
              color: "#fff",
              cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isLoading ? "..." : "送信"}
          </button>
        </div>
      </div>
    </main>
  );
}