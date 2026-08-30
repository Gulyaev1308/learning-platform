import { Pool, QueryResult } from 'pg';

// Создаем пул подключений к Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  /**
   * Универсальный хелпер для выполнения запросов к PostgreSQL
   * @param text - Строка SQL запроса ($1, $2 вместо ?)
   * @param params - Массив параметров
   */
  query: (text: string, params?: unknown[]): Promise<QueryResult> => {
    return pool.query(text, params);
  },
  pool: pool,
};
