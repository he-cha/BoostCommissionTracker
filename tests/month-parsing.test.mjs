import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoostCSV } from '../src/lib/csvParser.ts';

test('parses month ranges like Month 2-6 into individual month records', () => {
  const csv = `Payment Date,Activation Date/Swap Date,IMEI,Amount,Payment Type,Payment Description,Sale Type,Rep Username,Business Name,Adjustment Reason
2024-01-10,2024-01-01,123456789012345,100,Commission - Month 2-6,Commission - Month 2-6,Standard,rep1,Store A,
`;

  const records = parseBoostCSV(csv, 'file-1');

  assert.equal(records.length, 5);
  assert.deepEqual(records.map(record => record.monthNumber), [2, 3, 4, 5, 6]);
});

test('infers month numbers from activation and payment dates when the month is not explicit', () => {
  const csv = `Payment Date,Activation Date/Swap Date,IMEI,Amount,Payment Type,Payment Description,Sale Type,Rep Username,Business Name,Adjustment Reason
2024-05-01,2024-03-01,123456789012345,100,Commission,Commission,Standard,rep1,Store A,
`;

  const records = parseBoostCSV(csv, 'file-1');

  assert.equal(records.length, 1);
  assert.equal(records[0].monthNumber, 2);
});
