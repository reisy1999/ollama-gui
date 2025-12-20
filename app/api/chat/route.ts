import { NextResponse } from 'next/server';
import Stream from 'stream';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    // レスポンスのステータスチェック
    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    // bodyがnullでないことを確認
    if (!ollamaResponse.body) {
      throw new Error('Response body is null');
    }

    // ここからがポイント！
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder(); // 追加: 文字列をUint8Arrayに変換するため

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Uint8Array → 文字列
            const text = decoder.decode(value);

            // 改行で分割（複数のJSONが入っている場合がある）
            const lines = text.split('\n').filter(line => line.trim());

            for (const line of lines) {
              const json = JSON.parse(line);

              // contentだけ送る（Uint8Arrayに変換）
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content));
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}