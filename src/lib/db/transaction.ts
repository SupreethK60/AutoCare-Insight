import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getMySqlPool, handleMySqlError } from './mysql';

export interface TransactionContext {
  connection: PoolConnection;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<ResultSetHeader>;
}

export async function withTransaction<T>(
  callback: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  const pool = getMySqlPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const runQuery = async <R = any>(sql: string, params: any[] = []): Promise<R[]> => {
      try {
        const [rows] = await connection.execute<RowDataPacket[] & R[]>(sql, params);
        return rows as R[];
      } catch (err: any) {
        return handleMySqlError(err);
      }
    };

    const runQueryOne = async <R = any>(sql: string, params: any[] = []): Promise<R | null> => {
      const rows = await runQuery<R>(sql, params);
      return rows.length > 0 ? rows[0] : null;
    };

    const runExecute = async (sql: string, params: any[] = []): Promise<ResultSetHeader> => {
      try {
        const [result] = await connection.execute<ResultSetHeader>(sql, params);
        return result;
      } catch (err: any) {
        return handleMySqlError(err);
      }
    };

    const tx: TransactionContext = {
      connection,
      query: runQuery,
      queryOne: runQueryOne,
      execute: runExecute
    };

    const result = await callback(tx);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('[Transaction Rollback Error]', rollbackErr);
    }
    throw error;
  } finally {
    connection.release();
  }
}
