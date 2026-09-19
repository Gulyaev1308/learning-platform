'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/ui/LogoutButton';

interface Leader { id: number; email: string; name: string; students_count: number; }
interface Block { id: number; title: string; order_index: number; is_premium?: boolean; modules: Module[]; }
interface Module { id: number; title: string; order_index: number; lessons: Lesson[]; }
interface Lesson { id: number; title: string; type: string; content: string; description: string; quiz_data?: string; homework_data?: string; order_index: number; case_images?: string[]; case_details?: any;}

export default function AdminPage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [structure, setStructure] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentBlockId, setCurrentBlockId] = useState<number | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);

  const fetchLeaders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leaders');
      const data = await response.json();
      setLeaders(data.leaders || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaders(); }, [fetchLeaders]);

  const fetchStructure = useCallback(async (leaderId: number) => {
    try {
      const response = await fetch(`/api/admin/leaders/${leaderId}/structure`);
      const data = await response.json();
      setStructure(data.structure || []);
    } catch (err) { console.error(err); }
  }, []);

  const handleSelectLeader = (leader: Leader) => {
    setSelectedLeader(leader);
    setCurrentBlockId(null);
    setCurrentModuleId(null);
    fetchStructure(leader.id);
  };

  const refresh = () => { if (selectedLeader) fetchStructure(selectedLeader.id); };

  const handleSaveBlock = async (data: any) => {
    if (!selectedLeader) return;
    const url = data.id ? `/api/admin/blocks/${data.id}` : `/api/admin/leaders/${selectedLeader.id}/blocks`;
    const method = data.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowBlockForm(false); setEditingBlock(null); refresh();
  };

  const handleDeleteBlock = async (blockId: number) => {
    if (!confirm('Удалить блок?')) return;
    await fetch(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
    refresh();
  };

  const handleSaveModule = async (data: any) => {
    if (!currentBlockId) return;
    const url = data.id ? `/api/admin/modules/${data.id}` : `/api/admin/blocks/${currentBlockId}/modules`;
    const method = data.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowModuleForm(false); setEditingModule(null); refresh();
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Удалить модуль?')) return;
    await fetch(`/api/admin/modules/${moduleId}`, { method: 'DELETE' });
    refresh();
  };

  const handleSaveLesson = async (data: any) => {
    if (!currentModuleId) return;
    const url = data.id ? `/api/admin/lessons/${data.id}` : '/api/admin/lessons';
    const method = data.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, module_id: currentModuleId, block_id: currentBlockId, leader_id: selectedLeader?.id }) });
    setShowLessonForm(false); setEditingLesson(null); refresh();
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Удалить урок?')) return;
    await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
    refresh();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-900 font-semibold">Загрузка...</p></div>;

  const selectedBlock = structure.find(b => b.id === currentBlockId);
  const selectedModule = selectedBlock?.modules.find(m => m.id === currentModuleId);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
          <LogoutButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
  <button onClick={() => setShowLeaderForm(true)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">+ Создать лидера</button>
  <button onClick={async () => {
    const res = await fetch('/api/admin/clean', { method: 'POST' });
    const data = await res.json();
    alert(data.message || data.error || 'Готово');
    location.reload();
  }} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg">🗑 Очистить базу</button>
</div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Лидеры</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {leaders.map(leader => (
                <button key={leader.id} onClick={() => handleSelectLeader(leader)}
                  className={`w-full text-left p-3 rounded-lg border-2 ${selectedLeader?.id === leader.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                  <div className="font-bold text-gray-900 text-sm">{leader.name}</div>
                  <div className="text-xs text-gray-700">{leader.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-900">Блоки</h2>
              {selectedLeader && <button onClick={() => { setEditingBlock(null); setShowBlockForm(true); }} className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">+ Блок</button>}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {structure.map(block => (
                <div key={block.id} className={`p-2 rounded-lg border-2 ${currentBlockId === block.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                  <div className="flex justify-between items-center gap-1">
                    <button onClick={() => { setCurrentBlockId(block.id); setCurrentModuleId(null); }} className="font-bold text-gray-900 text-sm flex-1 text-left">{block.title} {block.is_premium && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm font-normal">🔒 Платный</span>}</button>
                    <button onClick={() => { setEditingBlock(block); setShowBlockForm(true); }} className="text-blue-700 text-xs">✏️</button>
                    <button onClick={() => handleDeleteBlock(block.id)} className="text-red-700 text-xs">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-900">Модули</h2>
              {currentBlockId && <button onClick={() => { setEditingModule(null); setShowModuleForm(true); }} className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">+ Модуль</button>}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {selectedBlock?.modules.map(mod => (
                <div key={mod.id} className={`p-2 rounded-lg border-2 ${currentModuleId === mod.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                  <div className="flex justify-between items-center gap-1">
                    <button onClick={() => setCurrentModuleId(mod.id)} className="font-bold text-gray-900 text-sm flex-1 text-left">{mod.title}</button>
                    <button onClick={() => { setEditingModule(mod); setShowModuleForm(true); }} className="text-blue-700 text-xs">✏️</button>
                    <button onClick={() => handleDeleteModule(mod.id)} className="text-red-700 text-xs">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-900">Уроки</h2>
              {currentModuleId ? <button onClick={() => { setEditingLesson(null); setShowLessonForm(true); }} className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">+ Урок</button> : <span className="text-xs text-gray-700">Выберите модуль</span>}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {selectedModule?.lessons.map(lesson => (
                <div key={lesson.id} className="p-2 rounded-lg border-2 border-gray-300 bg-white">
                  <div className="flex justify-between items-center gap-1">
                    <span className="font-bold text-gray-900 text-sm flex-1">{lesson.title}</span>
                    <button onClick={() => { setEditingLesson(lesson); setShowLessonForm(true); }} className="text-blue-700 text-xs">✏️</button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-700 text-xs">🗑</button>
                  </div>
                  <div className="text-xs text-gray-700 mt-1">Тип: {lesson.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLeaderForm && <LeaderForm onSave={async (data: any) => {
        await fetch('/api/admin/leaders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        setShowLeaderForm(false); fetchLeaders();
      }} onCancel={() => setShowLeaderForm(false)} />}

      {showBlockForm && selectedLeader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editingBlock ? 'Редактировать блок' : 'Создать блок'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Название блока</label>
                <input 
                  type="text" 
                  id="block-title-input"
                  defaultValue={editingBlock?.title || ''} 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  id="block-premium-input"
                  defaultChecked={editingBlock?.is_premium || false}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>🔒 Платный блок (требует подтверждения перевода на карту)</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => { setShowBlockForm(false); setEditingBlock(null); }} 
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  const titleEl = document.getElementById('block-title-input') as HTMLInputElement | null;
                  const premiumEl = document.getElementById('block-premium-input') as HTMLInputElement | null;
                  handleSaveBlock({
                    id: editingBlock?.id,
                    title: titleEl ? titleEl.value : '',
                    is_premium: premiumEl ? premiumEl.checked : false
                  });
                }} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {showModuleForm && currentBlockId && <SimpleForm title="Модуль" initialValue={editingModule?.title || ''} onSave={(title: string) => handleSaveModule({ id: editingModule?.id, title })} onCancel={() => { setShowModuleForm(false); setEditingModule(null); }} />}

      {showLessonForm && currentModuleId && <LessonForm lesson={editingLesson} onSave={handleSaveLesson} onCancel={() => { setShowLessonForm(false); setEditingLesson(null); }} />}
    </div>
  );
}

function SimpleForm({ title, initialValue, onSave, onCancel }: any) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium mb-4" autoFocus />
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 font-semibold">Отмена</button>
          <button onClick={() => onSave(value)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function LeaderForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Создать лидера</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <input type="text" placeholder="Имя" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" required />
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" required />
          <input type="password" placeholder="Пароль" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" required />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 font-semibold">Отмена</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Создать</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LessonForm({ lesson, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    id: lesson?.id || null,
    title: lesson?.title || '',
    description: lesson?.description || '',
    type: lesson?.type || 'video',
    content: lesson?.content || '',
    order_index: lesson?.order_index || 1,
  });
  const [uploading, setUploading] = useState(false);
  const [quizType, setQuizType] = useState<'options' | 'free_text'>('options');
  const [questions, setQuestions] = useState<any[]>([{ question: '', options: ['', '', '', ''] }]);
  const [freeQuestions, setFreeQuestions] = useState<any[]>([{ question: '' }]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [homeworkText, setHomeworkText] = useState('');
  const [showHomework, setShowHomework] = useState(false);
  const [caseImages, setCaseImages] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [products, setProducts] = useState('');
  const [resultText, setResultText] = useState('');

  useEffect(() => {
    if (lesson?.quiz_data) {
      try {
        const quiz = JSON.parse(lesson.quiz_data);
        if (quiz.type === 'free_text') {
          setQuizType('free_text');
          setFreeQuestions(quiz.questions || [{ question: '' }]);
        } else {
          setQuizType('options');
          setQuestions(quiz.questions || [{ question: '', options: ['', '', '', ''] }]);
        }
        setShowQuiz(true);
      } catch {}
    }
    if (lesson?.homework_data) {
      setHomeworkText(lesson.homework_data);
      setShowHomework(true);
    }
    if (lesson?.type === 'case') {
      setCaseImages(Array.isArray(lesson.case_images) ? lesson.case_images : []);
      const details = typeof lesson.case_details === 'string' 
        ? JSON.parse(lesson.case_details || '{}') 
        : (lesson.case_details || {});
      setDuration(details.duration || '');
      setResultText(details.resultText || '');
      setProducts(details.products ? details.products.join(', ') : '');
    } else {
      // Очищаем поля кейса, если открыли обычный урок, чтобы данные не смешивались
      setCaseImages([]); setDuration(''); setProducts(''); setResultText('');
    }
  }, [lesson]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    setUploading(true);

    try {
      console.log('=== [FRONTEND LOG: Начало чанковой отправки (Multipart)] ===');
      console.log(`Файл: ${file.name}, Общий размер: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Шаг 1: Инициализация загрузки на бэкенде (получаем uploadId и уникальный key)
      const initResponse = await fetch(`/api/admin/upload?fileName=${encodeURIComponent(file.name)}`, {
        method: 'GET',
      });
      
      if (!initResponse.ok) {
        const initData = await initResponse.json();
        throw new Error(initData.error || 'Не удалось инициализировать загрузку');
      }
      
      const { uploadId, key } = await initResponse.json();
      console.log(`[FRONTEND] Инициализировано успешно. ID: ${uploadId}`);

      // Шаг 2: Нарезка файла и отправка чанками
      const CHUNK_SIZE = 20 * 1024 * 1024; // Размер чанка — 20 МБ (оптимально для больших файлов)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadedParts = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const partNumber = i + 1;

        console.log(`[FRONTEND] Отправка чанка ${partNumber}/${totalChunks} (${((end - start) / 1024 / 1024).toFixed(2)} MB)...`);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk);
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('key', key);
        chunkFormData.append('partNumber', partNumber.toString());

        const chunkResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: chunkFormData,
        });

        if (!chunkResponse.ok) {
          const chunkData = await chunkResponse.json();
          throw new Error(chunkData.error || `Ошибка при загрузке части №${partNumber}`);
        }

        const chunkResult = await chunkResponse.json();
        
        // Сохраняем ETag и номер части для финальной сборки
        uploadedParts.push({
          PartNumber: chunkResult.PartNumber,
          ETag: chunkResult.ETag,
        });
      }

      console.log('[FRONTEND] Все части успешно загружены. Запрос на склейку файла...');

      // Шаг 3: Финальный запрос на склейку всех чанков в S3
      const completeResponse = await fetch('/api/admin/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          key,
          parts: uploadedParts,
        }),
      });

      const data = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(data.error || 'Не удалось завершить сборку файла на сервере');
      }

      console.log('=== [FRONTEND LOG: Успешно завершено] ===', data.url);

      // Ваша оригинальная логика распределения контента в стейты
      if (formData.type === 'case') {
        setCaseImages(prev => [...prev, data.url]);
      } else {
        setFormData({ ...formData, content: data.url });
      }

      alert('Файл успешно загружен по частям (Multipart)!');
      
    } catch (error) {
      console.error('Критическая ошибка загрузки:', error);
      alert((error as Error).message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    if (quizType === 'options') setQuestions([...questions, { question: '', options: ['', '', '', ''] }]);
    else setFreeQuestions([...freeQuestions, { question: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (quizType === 'options') setQuestions(questions.filter((_, i) => i !== index));
    else setFreeQuestions(freeQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let quiz_data = '';
    if (showQuiz) {
      if (quizType === 'options') {
        const valid = questions.filter(q => q.question.trim());
        if (valid.length > 0) quiz_data = JSON.stringify({ type: 'options', questions: valid });
      } else {
        const valid = freeQuestions.filter(q => q.question.trim());
        if (valid.length > 0) quiz_data = JSON.stringify({ type: 'free_text', questions: valid });
      }
    }
    const homework_data = showHomework ? homeworkText : '';

    // Создаем базовый объект для сохранения
    const savePayload: any = { ...formData, quiz_data, homework_data };

    // Если администратор создает или редактирует КЕЙС, добавляем новые поля
    if (formData.type === 'case') {
      savePayload.case_images = caseImages; // стейт с массивом картинок результатов
      savePayload.case_details = {
        duration: duration.trim(),
        resultText: resultText.trim(),
        products: products.split(',').map(p => p.trim()).filter(Boolean) // бьем строку БАДов в массив
      };
    }

    // Вызываем вашу оригинальную функцию сохранения, но передаем расширенный savePayload
    onSave(savePayload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{formData.id ? 'Изменить урок' : 'Новый урок'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Название урока</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Описание</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Тип контента</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-semibold bg-white">
              <option value="video">🎬 Видео</option>
              <option value="text">📄 Текст</option>
              <option value="case">🌱 Кейс результатов (Siberian Wellness)</option>
            </select>
          </div>

          {formData.type === 'case' ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-4">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                🌱 Настройка MLM Кейса Результатов
              </h4>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Загрузить фото/видео результатов (До/После)
                </label>
                <label className="block cursor-pointer bg-emerald-100 hover:bg-emerald-200 border-2 border-dashed border-emerald-400 rounded-lg p-4 text-center">
                  <span className="text-emerald-800 font-bold">📸 Нажмите для добавления файла в галерею кейса</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploading && <p className="text-emerald-700 text-sm mt-1 font-semibold">Загрузка...</p>}
                
                {/* Интерактивное превью уже загруженных картинок для кейса с кнопкой удаления */}
                {caseImages.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {caseImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 border border-emerald-300 flex-shrink-0 group">
                        <img src={img} alt="Результат" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setCaseImages(caseImages.filter((_, i) => i !== idx))} 
                          className="absolute inset-0 bg-red-600/80 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Срок применения программы БАД</label>
                  <input 
                    type="text" 
                    placeholder="например, 3 недели / 2 месяца" 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Продукты Siberian Wellness (через запятую)</label>
                  <input 
                    type="text" 
                    placeholder="НовоМин, Хронолонг, Истоки Чистоты" 
                    value={products} 
                    onChange={e => setProducts(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Полная история и разбор кейса (основной text)</label>
                <textarea 
                  placeholder="Опишите ситуацию, жалобы клиента и схему приема..." 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" 
                  rows={4} 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Итоговый вывод / Главный бизнес-инсайт</label>
                <input 
                  type="text" 
                  placeholder="Краткое резюме эксперта..." 
                  value={resultText} 
                  onChange={e => setResultText(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" 
                />
              </div>
            </div>
          ) : formData.type === 'video' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Загрузить видео</label>
                <label className="block cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg p-4 text-center">
                  <span className="text-blue-700 font-bold">📹 Выберите файл</span>
                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploading && <p className="text-blue-700 text-sm mt-1 font-semibold">Загрузка...</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Или URL</label>
                <input type="text" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="/videos/my-video.mp4" className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" />
              </div>
              {formData.content && formData.content.startsWith('/videos/') && (
                <video src={formData.content} controls className="w-full max-h-40 rounded bg-black" />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Текст урока</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900" rows={5} />
            </div>
          )}

          {/* Опрос/Тест */}
          <div className="border-t-2 pt-4">
            <button type="button" onClick={() => setShowQuiz(!showQuiz)} className="flex items-center gap-2 text-blue-700 font-bold">
              <span className="text-xl">{showQuiz ? '−' : '+'}</span> Добавить опрос
            </button>
            {showQuiz && (
              <div className="mt-3 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Тип опроса</label>
                  <select value={quizType} onChange={(e) => setQuizType(e.target.value as any)} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-semibold bg-white">
                    <option value="options">С вариантами ответов</option>
                    <option value="free_text">Свободный ответ (текст)</option>
                  </select>
                </div>

                {quizType === 'options' ? (
                  questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900">Вопрос {qIndex + 1}</span>
                        {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-600 text-sm font-bold">✕</button>}
                      </div>
                      <input type="text" value={q.question} onChange={(e) => { const newQ = [...questions]; newQ[qIndex].question = e.target.value; setQuestions(newQ); }} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium mb-3" placeholder="Вопрос..." />
                      <div className="space-y-2">
                        {q.options.map((opt: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <span className="text-gray-700 font-bold w-6">{oIndex + 1}.</span>
                            <input type="text" value={opt} onChange={(e) => { const newQ = [...questions]; newQ[qIndex].options[oIndex] = e.target.value; setQuestions(newQ); }} className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" placeholder={`Вариант ${oIndex + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  freeQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900">Вопрос {qIndex + 1}</span>
                        {freeQuestions.length > 1 && <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-600 text-sm font-bold">✕</button>}
                      </div>
                      <input type="text" value={q.question} onChange={(e) => { const newQ = [...freeQuestions]; newQ[qIndex].question = e.target.value; setQuestions(newQ); }} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" placeholder="Вопрос, на который ученик ответит текстом..." />
                    </div>
                  ))
                )}

                <button type="button" onClick={addQuestion} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-lg text-sm">+ Добавить вопрос</button>
              </div>
            )}
          </div>

          {/* Домашнее задание */}
          <div className="border-t-2 pt-4">
            <button type="button" onClick={() => setShowHomework(!showHomework)} className="flex items-center gap-2 text-green-700 font-bold">
              <span className="text-xl">{showHomework ? '−' : '+'}</span> Добавить домашнее задание
            </button>
            {showHomework && (
              <div className="mt-3 bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
                <textarea value={homeworkText} onChange={(e) => setHomeworkText(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900" rows={4} placeholder="Опишите задание..." />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Порядок</label>
            <input type="number" min="1" value={formData.order_index} onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-medium" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-800 font-bold">Отмена</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
