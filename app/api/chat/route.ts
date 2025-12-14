import { NextResponse } from 'next/server';

// デモ用のチャットAPIエンドポイント
export async function POST() {
    return NextResponse.json({ response: 'Hello from the chat API!' });
}