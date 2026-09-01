import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== [AUDIT] НАЧАЛО ЗАПРОСА К РОУТУ /api/lessons ===');
  try {
    const session = await getSession();
    if (!session) {
      console.log('⚠️ [AUDIT] Пользователь не авторизован (сессия пустая)');
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const currentUserId = session.userId || (session as any).id;
    console.log(`👤 [AUDIT] Авторизован юзер ID: ${currentUserId}, Роль в сессии: ${session.role}`);

    // 1. Проверяем пользователя в базе
    const userResult = await db.query('SELECT id, email, name, role, leader_id FROM users WHERE id = $1', [currentUserId]);
    if (userResult.rows.length === 0) {
      console.log('❌ [AUDIT] Юзер не найден в таблице users');
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    const user = userResult.rows[0];
    console.log(`🔍 [AUDIT] Данные из БД -> ID: ${user.id}, Имя: ${user.name}, Роль в БД: ${user.role}, Лидер: ${user.leader_id}`);

    const filterLeaderId = user.role === 'student' ? user.leader_id : user.id;
    console.log(`🗂 [AUDIT] Фильтр по контенту Лидера ID: ${filterLeaderId}`);

    // 2. Запрашиваем всю структуру обучения
    const allLessonsResult = await db.query(`
      SELECT 
        l.id as lesson_id, l.title as lesson_title, l.type as lesson_type, l.order_index as lesson_order,
        m.id as module_id, m.title as module_title,
        b.id as block_id, b.title as block_title, b.is_premium as block_is_premium
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      INNER JOIN blocks b ON b.id = m.block_id
      WHERE b.leader_id = $1 OR b.leader_id IS NULL
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `, [filterLeaderId]);

    console.log(`📚 [AUDIT] Найдено уроков в базе: ${allLessonsResult.rows.length}`);

    // 3. Вытягиваем ОДОБРЕННЫЕ платежи
    const paymentsResult = await db.query(
      "SELECT block_id, status FROM premium_access WHERE user_id = $1",
      [currentUserId]
    );
    console.log('💳 [AUDIT] Записи в premium_access для юзера:', paymentsResult.rows);
    
    const approvedBlockIds = new Set(
      paymentsResult.rows.filter(r => r.status === 'approved').map(r => r.block_id)
    );

    // 4. Получаем список пройденных уроков
    const progressResult = await db.query(
      "SELECT lesson_id FROM progress WHERE user_id = $1 AND status = 'completed'",
      [currentUserId]
    );
    const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));
    console.log(`✅ [AUDIT] Пройдено уроков юзером (IDs):`, Array.from(completedIds));

    let previousCompleted = true;
    
    // 5. Расчет лестницы с исправленной логикой приведения типов и защиты от сквозного прохода
    const lessonsWithStatus = allLessonsResult.rows.map((lesson, index) => {
      const isCompleted = completedIds.has(lesson.lesson_id);
      
      // Надежное приведение флага премиумности из БД к логическому типу
      const isPremiumFlagInDB = 
        lesson.block_is_premium === true || 
        lesson.block_is_premium === 'true' ||
        lesson.block_is_premium === 1 ||
        lesson.block_is_premium === '1';

      const hasLeaderApproved = approvedBlockIds.has(lesson.block_id);
      
      // Блокировка срабатывает, если пользователь — студент, блок платный, а лидер еще не подтвердил доступ
      const isBlockLockedByPayment = user.role === 'student' && isPremiumFlagInDB && !hasLeaderApproved;

      let status: string;
      if (isBlockLockedByPayment) {
        status = 'locked';
      } else if (isCompleted) {
        status = 'completed';
      } else if ((index === 0 || previousCompleted) && !isBlockLockedByPayment) {
        status = 'available';
      } else {
        status = 'locked';
      }

      console.log(
        `📈 [AUDIT LOGIC] Урок: "${lesson.lesson_title}" (Блок: "${lesson.block_title}") -> ` +
        `Премиум в БД (сырой): ${lesson.block_is_premium}, ` +
        `Распознан как Премиум: ${isPremiumFlagInDB}, ` +
        `Одобрен Лидером: ${hasLeaderApproved}, ` +
        `Блокировать по оплате: ${isBlockLockedByPayment} -> ИТОГОВЫЙ СТАТУС: ${status}`
      );
      
      // Если текущий шаг заблокирован по оплате или сам урок не пройден — прерываем цепочку доступности
      if (isBlockLockedByPayment || !isCompleted) {
        previousCompleted = false;
      } else {
        previousCompleted = true;
      }

      return {
        id: lesson.lesson_id,
        module_id: lesson.module_id,
        title: lesson.lesson_title,
        type: lesson.lesson_type,
        order_index: lesson.lesson_order,
        block_id: lesson.block_id,
        block_title: lesson.block_title,
        block_is_premium: isPremiumFlagInDB,
        module_title: lesson.module_title,
        status: status
      };
    });

    // Группировка структуры
    const blocksMap = new Map();
    for (const lesson of lessonsWithStatus) {
      if (!blocksMap.has(lesson.block_id)) {
        blocksMap.set(lesson.block_id, {
          id: lesson.block_id,
          title: lesson.block_title,
          is_premium: lesson.block_is_premium,
          modules: new Map(),
        });
      }
      
      const block = blocksMap.get(lesson.block_id);
      if (!block.modules.has(lesson.module_id)) {
        block.modules.set(lesson.module_id, {
          id: lesson.module_id,
          title: lesson.module_title,
          lessons: [],
        });
      }
      block.modules.get(lesson.module_id).lessons.push(lesson);
    }

    const result = Array.from(blocksMap.values()).map(b => ({
      ...b,
      modules: Array.from(b.modules.values())
    }));

    console.log('=== [AUDIT] ЗАПРОС УСПЕШНО ОБРАБОТАН И ОТПРАВЛЕН ===');
    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons: allLessonsResult.rows.length,
      completedLessons: completedIds.size,
      progressPercent: allLessonsResult.rows.length > 0 ? Math.round((completedIds.size / allLessonsResult.rows.length) * 100) : 0,
    });
  } catch (error) {
    console.error('❌ [AUDIT CRASH] Критическая ошибка роута:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
