import { Pool, QueryResult } from 'pg';

// Создаем пул соединений
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  /**
   * Универсальный хелпер для выполнения запросов к PostgreSQL
   * @param text - Строка SQL запроса
   * @param params - Массив параметров для безопасной подстановки ($1, $2...)
   */
  query: (text: string, params?: unknown[]): Promise<QueryResult> => {
    return pool.query(text, params);
  },
  pool: pool, // Экспортируем сам пул на случай кастомных операций
};
