import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    const { id: leaderId } = await params;

    // ДОБАВЛЕНО: выбираем b.is_premium из базы данных
    const structureResult = await db.query(`
      SELECT b.id as block_id, b.title as block_title, b.order_index as block_order, b.is_premium as block_is_premium,
             m.id as module_id, m.title as module_title, m.order_index as module_order,
             l.id as lesson_id, l.title as lesson_title, l.type as lesson_type, l.content as lesson_content, l.description as lesson_description, l.order_index as lesson_order
      FROM blocks b
      LEFT JOIN modules m ON m.block_id = b.id
      LEFT JOIN lessons l ON l.module_id = m.id
      WHERE b.leader_id = $1
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `, [leaderId]);

    const blocksMap = new Map();
    for (const row of structureResult.rows) {
      if (!row.block_id) continue;
      if (!blocksMap.has(row.block_id)) {
        blocksMap.set(row.block_id, { 
          id: row.block_id, 
          title: row.block_title, 
          order_index: row.block_order, 
          is_premium: row.block_is_premium, // Передаем на фронтенд
          modules: new Map() 
        });
      }
      const block = blocksMap.get(row.block_id);
      if (row.module_id && !block.modules.has(row.module_id)) {
        block.modules.set(row.module_id, { id: row.module_id, title: row.module_title, order_index: row.module_order, lessons: [] });
      }
      if (row.module_id && row.lesson_id) {
        block.modules.get(row.module_id).lessons.push({ id: row.lesson_id, title: row.lesson_title, type: row.lesson_type, content: row.lesson_content, description: row.lesson_description, order_index: row.lesson_order });
      }
    }

    const result = Array.from(blocksMap.values()).map(b => ({ ...b, modules: Array.from(b.modules.values()) }));
    return NextResponse.json({ success: true, structure: result });
  } catch (error) {
    console.error('Error in GET structure:', error);
    return NextResponse.json({ error: 'Ошибка структуры' }, { status: 500 });
  }
}
