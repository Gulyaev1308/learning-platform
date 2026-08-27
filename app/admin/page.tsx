'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/ui/LogoutButton';

interface Leader { id: number; email: string; name: string; students_count: number; }
interface Block { id: number; title: string; order_index: number; modules: Module[]; }
interface Module { id: number; title: string; order_index: number; lessons: Lesson[]; }
interface Lesson { id: number; title: string; type: string; content: string; description: string; quiz_data?: string; homework_data?: string; order_index: number; }

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
                    <button onClick={() => { setCurrentBlockId(block.id); setCurrentModuleId(null); }} className="font-bold text-gray-900 text-sm flex-1 text-left">{block.title}</button>
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

      {showBlockForm && selectedLeader && <SimpleForm title="Блок" initialValue={editingBlock?.title || ''} onSave={(title: string) => handleSaveBlock({ id: editingBlock?.id, title })} onCancel={() => { setShowBlockForm(false); setEditingBlock(null); }} />}

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
  }, [lesson]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formDataUpload });
      const data = await response.json();
      if (response.ok) setFormData({ ...formData, content: data.url });
      else alert(data.error || 'Ошибка');
    } catch { alert('Ошибка загрузки'); } finally { setUploading(false); }
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
    onSave({ ...formData, quiz_data, homework_data });
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
            </select>
          </div>

          {formData.type === 'video' ? (
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
