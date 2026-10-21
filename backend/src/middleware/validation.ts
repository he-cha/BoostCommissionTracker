import { Request, Response, NextFunction } from 'express';

const strings = new Set(['imei','store','paymentDate','activationDate','paymentType','paymentDescription',
  'adjustmentReason','saleType','repUsername','fileId','customerName','customerNumber','customerEmail','notes']);
const booleans = new Set(['isActive','paymentReceived','manuallyEntered','suspended','deactivated',
  'blacklisted','byodSwap','withholdingResolved']);
const noteFields = new Set(['notes','suspended','deactivated','blacklisted','byodSwap','customerName',
  'customerNumber','customerEmail','withholdingResolved','isActive']);
const metadata = new Set(['id','_id','__v','filename']);

export function plainObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.getPrototypeOf(body) !== Object.prototype) throw new Error('Expected a JSON object');
  return body as Record<string, unknown>;
}
function dateValid(value: string) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) && Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0,10) === value.slice(0,10);
}
export function commissionInput(body: unknown, partial = false, notesOnly = false) {
  const input = plainObject(body);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    // Ignore frontend/database identity metadata; never accept it as a writable field.
    if (metadata.has(key) && !notesOnly) continue;
    if (notesOnly && !noteFields.has(key)) throw new Error(`Unexpected notes field: ${key}`);
    if (strings.has(key)) {
      if (typeof value !== 'string' || value.length > (key === 'notes' ? 10000 : 1000)) throw new Error(`Invalid ${key}`);
      const text = key === 'notes' ? value : value.trim();
      if (['imei','store','fileId'].includes(key) && (!text || text.length > 128)) throw new Error(`Invalid ${key}`);
      if ((key === 'paymentDate' || key === 'activationDate') && text && !dateValid(text)) throw new Error(`Invalid ${key}`);
      if (key === 'customerEmail' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error('Invalid customerEmail');
      out[key] = text;
    } else if (booleans.has(key)) {
      if (typeof value !== 'boolean') throw new Error(`Invalid ${key}`);
      out[key] = value;
    } else if (key === 'amount') {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('amount must be a finite number');
      out[key] = value; // Negative clawbacks and zero payments are valid.
    } else if (key === 'monthNumber') {
      if (value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 6)) throw new Error('Invalid monthNumber');
      out[key] = value;
    } else { throw new Error(`Unexpected commission field: ${key}`); }
  }
  if (!partial && (!out.imei || !out.store || out.amount === undefined)) throw new Error('imei, store and amount are required');
  if (!Object.keys(out).length) throw new Error('No editable fields supplied');
  return out;
}
export function validateCommission(partial = false, notesOnly = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    try { req.body = commissionInput(req.body, partial, notesOnly); next(); }
    catch (error) { res.status(400).json({ error: (error as Error).message }); }
  };
}
export function validateId(req: Request, res: Response, next: NextFunction) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ error: 'Invalid record ID' });
  return next();
}
export function validateIMEI(req: Request, res: Response, next: NextFunction) {
  if (!req.params.imei?.trim() || req.params.imei.length > 128) return res.status(400).json({ error: 'Invalid device identifier' });
  return next();
}
export function validateUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { records } = plainObject(req.body);
    if (!Array.isArray(records) || !records.length || records.length > 20000) throw new Error('Supply 1–20000 records per upload');
    req.body = { records: records.map((record, i) => {
      try { return commissionInput(record); }
      catch (error) { throw new Error(`Record ${i + 1}: ${(error as Error).message}`); }
    }) };
    next();
  } catch (error) { res.status(400).json({ error: (error as Error).message }); }
}
export function validateFile(req: Request, res: Response, next: NextFunction) {
  try {
    const body = plainObject(req.body);
    if (Object.keys(body).some(k => !['fileId','filename','recordCount','totalAmount'].includes(k))) throw new Error('Unexpected file metadata');
    for (const key of ['fileId','filename']) if (typeof body[key] !== 'string' || !(body[key] as string).trim() || (body[key] as string).length > 255) throw new Error(`Invalid ${key}`);
    if (!Number.isSafeInteger(body.recordCount) || (body.recordCount as number) < 0) throw new Error('Invalid recordCount');
    if (typeof body.totalAmount !== 'number' || !Number.isFinite(body.totalAmount)) throw new Error('Invalid totalAmount');
    next();
  } catch (error) { res.status(400).json({ error: (error as Error).message }); }
}
