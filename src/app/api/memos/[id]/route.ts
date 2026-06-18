import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: `memo ${id} not found` }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { content, tag, x, y } = body ?? {};

  if (typeof content !== 'string' || content.length > 500) {
    return NextResponse.json(
      { error: 'content must be a string ≤ 500 characters' },
      { status: 400 },
    );
  }

  return NextResponse.json({ id, content, tag: tag ?? null, x, y });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ deleted: id });
}
