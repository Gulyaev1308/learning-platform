import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Связываем уроки с модулями и блоками через JOIN для правильного отображения в админке
    const lessonsResult = await db.query(`
      SELECT 
        l.*, 
        m.title as module_title, 
        m.block_id, 
        b.title as block_title
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      INNER JOIN blocks b ON b.id = m.block_id
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `);

    return NextResponse.json({ success: true, lessons: lessonsResult.rows });
  } catch (error) {
    console.error('Error fetching admin lessons:', error);
    return NextResponse.json({ error: 'Ошибка при получении уроков' }, { status: 500 });
  }
}
