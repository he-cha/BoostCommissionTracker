// API records use MongoDB _id; client components use id for edits and deletes.
export function withDatabaseId<T extends { id?: string; _id?: string }>(record: T): T & { id: string } {
  const id = record._id || record.id;
  if (!id || typeof id !== 'string') throw new Error('A commission record is missing its ID');
  return { ...record, id };
}
