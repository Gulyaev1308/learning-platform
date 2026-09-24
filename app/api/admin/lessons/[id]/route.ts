import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      type, 
      content, 
      description, 
      quiz_data, 
      module_id, 
      order_index,
      case_images,
      case_details
    } = body;

    const dbQuizData = typeof quiz_data === 'object' ? JSON.stringify(quiz_data) : (quiz_data || '[]');

    // ИСПРАВЛЕНО: Безопасное приведение типов для колонок кейса
    const dbType = type === 'case' ? 'text' : type;
    const dbContent = type === 'case' && content?.startsWith('/videos/') ? '' : (content || '');
    
    const dbCaseImages = Array.isArray(case_images) 
      ? JSON.stringify(case_images) 
      : typeof case_images === 'string' ? case_images : '[]';

    const dbCaseDetails = case_details 
      ? (typeof case_details === 'object' ? JSON.stringify(case_details) : case_details)
      : (type === 'case' ? '{}' : null);

    // ИСПРАВЛЕНО: Добавлены пропущенные колонки case_images и case_details в запрос UPDATE
    await db.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title), 
           type = COALESCE($2, type), 
           content = COALESCE($3, content), 
           description = COALESCE($4, description), 
           quiz_data = COALESCE($5, quiz_data), 
           module_id = COALESCE($6, module_id), 
           order_index = COALESCE($7, order_index)::integer,
           case_images = $8::jsonb,
           case_details = $9::jsonb
       WHERE id = $10`,
      [title, dbType, dbContent, description, dbQuizData, module_id, order_index, dbCaseImages, dbCaseDetails, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lesson data:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    await db.query('DELETE FROM lessons WHERE id = \$1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
