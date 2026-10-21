import test from 'node:test';
import assert from 'node:assert/strict';
import { withDatabaseId } from '../src/lib/recordIdentity.ts';
test('uses the persistent database identity for edit/delete routes',()=>{
  assert.equal(withDatabaseId({_id:'a'.repeat(24),id:'temporary-csv-id',amount:25}).id,'a'.repeat(24));
});
test('keeps a client ID when no database ID exists and rejects missing IDs',()=>{
  assert.equal(withDatabaseId({id:'local-draft'}).id,'local-draft');
  assert.throws(()=>withDatabaseId({}),/missing its ID/);
});
