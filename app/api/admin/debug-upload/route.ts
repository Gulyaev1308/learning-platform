import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  try {
    // Получаем целевой URL из заголовков, который фронтенд хотел вызвать в Cloud.ru
    const targetUrl = request.headers.get('x-debug-target-url');
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    console.log('=== [DEBUG LOG START] ===');
    console.log('Отправляем OPTIONS запрос на Cloud.ru...');
    
    const cloudResponse = await fetch(targetUrl, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type',
        'Origin': 'https://edtechmlm.ru'
      }
    });

    const responseText = await cloudResponse.text();
    
    console.log('Статус ответа Cloud.ru:', cloudResponse.status);
    console.log('Заголовки ответа Cloud.ru:', Object.fromEntries(cloudResponse.headers.entries()));
    console.log('Тело ответа (XML/Текст):', responseText);
    console.log('=== [DEBUG LOG END] ===');

    // Возвращаем фронтенду то, что ответило облако, чтобы прочитать это в браузере
    return new NextResponse(responseText, {
      status: cloudResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, PUT',
        'Access-Control-Allow-Headers': '*'
      }
    });
  } catch (error) {
    console.error('Ошибка логирования:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
