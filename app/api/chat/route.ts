import { NextResponse } from 'next/server';

// Ollamaとの連携APIエンドポイント
export async function POST(request: Request) {
    try {
        // フロントからpromptを受け取る
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'プロンプト未入力です' },
                { status: 400 }
            );
        }

        // Ollama APIにリクエストを送信
        const ollamaResponse = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'hf.co/unsloth/Qwen3-4B-Instruct-2507-GGUF:Q4_K_M',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: false, // ストリーミングなし
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const data = await ollamaResponse.json();

        // Ollamaからのレスポンスを返す
        return NextResponse.json({
            response: data.message.content,
            metadata: {
                model: data.model,
                eval_count: data.eval_count,
                total_duration: data.total_duration,
            } });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}