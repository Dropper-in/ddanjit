import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, tag, x = 100, y = 100 } = body ?? {};

  if (typeof content !== 'string' || content.length > 500) {
    return NextResponse.json(
      { error: 'content must be a string ≤ 500 characters' },
      { status: 400 },
    );
  }

  const memo = {
    id: crypto.randomUUID(),
    content,
    tag: tag ?? null,
    userId: 'stub-user',
    x,
    y,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(memo, { status: 201 });
}
