'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params ? (params.id as string) : '';
  
  const [lesson, setLesson] = useState<any>(null);
  const [quizContent, setQuizContent] = useState<any>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any>({});
  const [sending, setSending] = useState(false);

  // Состояния для парсинга данных MLM кейса
  const [caseImages, setCaseImages] = useState<string[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();
        if (data.success && data.lesson) {
          setLesson(data.lesson);
          
          // Парсим квизы
          if (data.lesson.quiz_data) {
            setQuizContent(typeof data.lesson.quiz_data === 'string' ? JSON.parse(data.lesson.quiz_data) : data.lesson.quiz_data);
          }

          // Парсим данные картинок кейса
          if (data.lesson.case_images) {
            const imgs = typeof data.lesson.case_images === 'string' 
              ? JSON.parse(data.lesson.case_images) 
              : data.lesson.case_images;
            setCaseImages(Array.isArray(imgs) ? imgs : []);
          }

          // Парсим детали кейса
          if (data.lesson.case_details) {
            const details = typeof data.lesson.case_details === 'string'
              ? JSON.parse(data.lesson.case_details)
              : data.lesson.case_details;
            setCaseDetails(details);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (lessonId) fetchLesson();
  }, [lessonId]);

  const handleCompleteLesson = async () => {
    if (sending) return;
    setSending(true);
    try {
      if (quizContent && quizContent.questions && quizContent.questions.length > 0) {
        const formattedAnswers = quizContent.questions.map((q: any, i: number) => ({
          question: q.text || q.question,
          answer: answers[i] || 'Нет ответа'
        }));

        await fetch(`/api/lessons/${lessonId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: formattedAnswers })
        });
      }

      await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
      alert('Урок успешно пройден!');
      router.push('/dashboard');
    } catch (err) {
      alert('Ошибка при сохранении прогресса');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Загрузка...</div>;
  if (!lesson) return <div className="min-h-screen flex items-center justify-center text-red-500">Урок не найден</div>;

  const hasVideo = lesson.type === 'video' && lesson.content;
  const isActionAvailable = !hasVideo || videoEnded;

  let videoSrc = '';
  if (hasVideo) {
    let cleanContent = lesson.content.trim();
    const fileName = cleanContent.split('/').pop();
    videoSrc = `/api/videos/${fileName}`;
  }

  // Флаг проверки: является ли этот урок сохраненным кейсом результатов
  const isCaseLayout = caseImages.length > 0 || (caseDetails && (caseDetails.duration || caseDetails.resultText || (caseDetails.products && caseDetails.products.length > 0)));

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition font-medium">
            ← Назад к модулям
          </button>
        </div>
        
        {/* БЛОК 1: СТАНДАРТНЫЙ ВИДЕОПЛЕЕР */}
        {hasVideo && videoSrc && (
          <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video max-h-[70vh] mx-auto">
            <video src={videoSrc} controls controlsList="nodownload" onEnded={() => setVideoEnded(true)} className="w-full h-full object-contain" />
          </div>
        )}

        {/* БЛОК 2: ИНФОРМАТИВНЫЙ MLM-КЕЙС РЕЗУЛЬТАТОВ (Отображается, если есть данные кейса) */}
        {isCaseLayout && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-emerald-200 pb-3">
              <span className="text-2xl">🌱</span>
              <h3 className="text-lg font-bold text-emerald-950">Кейс результатов Siberian Wellness</h3>
            </div>

            {/* ГАЛЕРЕЯ ФОТО КЕЙСА */}
            {caseImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseImages.map((img, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center">
                    <img src={img} alt={`Результат ${idx + 1}`} className="max-h-[50vh] rounded-lg object-contain w-full" />
                    <span className="text-xs text-gray-500 mt-2 font-medium">Фотофиксация результата #{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ОПЦИОНАЛЬНОЕ ПОЛЕ: СРОК ПРИМЕНЕНИЯ ПРОГРАММЫ */}
            {caseDetails?.duration && caseDetails.duration.trim() !== '' && (
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">⏱️ Срок применения программы:</h4>
                <p className="text-sm text-gray-800 font-semibold">{caseDetails.duration}</p>
              </div>
            )}

            {/* ОПЦИОНАЛЬНОЕ ПОЛЕ: ИСПОЛЬЗУЕМЫЕ ПРОДУКТЫ SIBERIAN WELLNESS */}
            {caseDetails?.products && caseDetails.products.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">📦 Продукты Siberian Wellness в кейсе:</h4>
                <div className="flex flex-wrap gap-2">
                  {caseDetails.products.map((product: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ОПЦИОНАЛЬНОЕ ПОЛЕ: ИТОГОВЫЙ ВЫВОД И РЕЗУЛЬТАТ */}
            {caseDetails?.resultText && caseDetails.resultText.trim() !== '' && (
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">📝 Итоговый вывод / Описание изменений:</h4>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{caseDetails.resultText}</p>
              </div>
            )}
          </div>
        )}

        {/* ИСПРАВЛЕНО: Для видеоуроков скрываем текст контента (ссылку), для кейсов блок скрыт полностью, а для текста — отображается описание */}
        {lesson && lesson.type !== 'case' && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Материал урока:</h2>
            {lesson.type !== 'video' ? (
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                {lesson.content}
              </p>
            ) : (
              <p className="text-slate-500 text-sm italic">Изучите видеоматериал выше</p>
            )}
          </div>
        )}      

        {lesson.description && (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание урока:</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
          </div>
        )}

        <div className={`transition-all duration-300 ${isActionAvailable ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            {quizContent && quizContent.questions && quizContent.questions.length > 0 ? (
              <>
                <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  📋 Тест / Опрос к уроку: 
                  {!isActionAvailable && <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full ml-2 font-medium">Доступно после просмотра видео</span>}
                </h2>
                {isActionAvailable && quizContent.questions.map((q: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="font-semibold text-sm mb-3 text-gray-900">{i + 1}. {q.text || q.question}</p>
                    {quizContent.type === 'options' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition text-sm text-gray-800 font-medium">
                            <input type="radio" name={`q-${i}`} value={opt} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} className="text-blue-600 h-4 w-4" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {quizContent.type === 'free_text' && (
                      <textarea rows={3} placeholder="Введите ваш ответ здесь..." onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition shadow-inner" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <h2 className="text-lg font-semibold text-blue-900">
                {!isActionAvailable ? '⏳ Пожалуйста, посмотрите видео для завершения урока' : '✅ Ознакомились с материалом?'}
              </h2>
            )}
            
            <button onClick={handleCompleteLesson} disabled={!isActionAvailable || sending} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm shadow-md transition-all active:scale-98">
              {sending ? 'Сохранение...' : quizContent?.questions?.length > 0 ? '🚀 Отправить ответы' : '✅ Завершить урок'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
