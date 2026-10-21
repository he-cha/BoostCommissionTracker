import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, API_BASE_URL } from '../src/lib/api.ts';
let originalFetch, events;
beforeEach(() => {
  originalFetch=globalThis.fetch;
  const storage=new Map([['token','synthetic-session']]);
  globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  globalThis.window=new EventTarget();events=0;window.addEventListener('session-expired',()=>events++);
});
afterEach(()=>{globalThis.fetch=originalFetch;delete globalThis.window;delete globalThis.localStorage;});
test('attaches bearer token while preserving JSON headers and request body',async()=>{
  fetch=async(url,init)=>{assert.equal(url,API_BASE_URL+'/api/commissions');assert.equal(init.headers.get('Authorization'),'Bearer synthetic-session');assert.equal(init.headers.get('Content-Type'),'application/json');assert.equal(init.body,'{}');return Response.json({ok:true});};
  assert.equal((await apiFetch(API_BASE_URL+'/api/commissions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,200);
});
test('never sends the token to a different origin',async()=>{
  let called=false;fetch=async()=>{called=true;return Response.json({});};
  await assert.rejects(apiFetch('https://example.com/api/commissions'),/Unexpected API origin/);assert.equal(called,false);
});
test('missing token requests sign-in without making a network call',async()=>{
  localStorage.removeItem('token');let called=false;fetch=async()=>{called=true;return Response.json({});};
  await assert.rejects(apiFetch(API_BASE_URL+'/api/commissions'),/sign in/);assert.equal(called,false);assert.equal(events,1);
});
test('401 clears the session and requests login',async()=>{
  fetch=async()=>Response.json({error:'Expired'},{status:401});
  await assert.rejects(apiFetch(API_BASE_URL+'/api/commissions'),/session expired/);assert.equal(localStorage.getItem('token'),null);assert.equal(events,1);
});
test('server validation errors are propagated instead of reported as success',async()=>{
  fetch=async()=>Response.json({error:'Invalid monthNumber'},{status:400});
  await assert.rejects(apiFetch(API_BASE_URL+'/api/commissions'),/Invalid monthNumber/);
});
