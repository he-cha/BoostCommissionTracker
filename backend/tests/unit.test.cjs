const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken');
const app=require('../dist/app').default;
const {requireAuth}=require('../dist/middleware/auth');
const {commissionInput}=require('../dist/middleware/validation');
const Record=require('../dist/models/CommissionRecord').default;
let server,base;
const secret='synthetic-unit-secret-with-more-than-thirty-two-characters';
const token=()=>jwt.sign({userId:'a'.repeat(24)},secret,{expiresIn:'1h'});
const sample={imei:'123456789012345',store:'Synthetic',amount:-10,activationDate:'2024-01-01'};
before(async()=>{process.env.JWT_SECRET=secret;server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise(r=>server.close(r));});
async function request(path,method='GET',body,auth=true){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+token()}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return response;}
test('all commission and file route families reject unauthenticated requests before database access',async()=>{
 for(const [path,method,body] of [['/api/commissions','GET'],['/api/commissions','POST',sample],['/api/commissions/upload','POST',{records:[sample]}],['/api/commissions/backfill-months','POST',{}],['/api/commissions/imei/123/notes','PUT',{notes:'x'}],['/api/uploaded-files','GET'],['/api/uploaded-files','POST',{}],['/api/uploaded-files/test','DELETE']])assert.equal((await request(path,method,body,false)).status,401);
});
test('verifies signature, expiration, algorithm and identity claims',()=>{
 const tokens=[token(),'bad-token',jwt.sign({userId:'a'.repeat(24)},secret,{expiresIn:-1}),jwt.sign({userId:'a'.repeat(24)},'different-secret',{expiresIn:'1h'}),jwt.sign({userId:'a'.repeat(24)},secret,{algorithm:'HS384',expiresIn:'1h'}),jwt.sign({username:'x'},secret,{expiresIn:'1h'}),jwt.sign({userId:'a'.repeat(24)},secret)];
 for(const [i,t]of tokens.entries()){
  let status=200,next=false;const res={locals:{},status(n){status=n;return this;},json(){return this;}};
  requireAuth({get:()=>`Bearer ${t}`},res,()=>{next=true;});assert.equal(next,i===0);if(i)assert.equal(status,401);
 }
});
test('fails closed with missing secret',()=>{delete process.env.JWT_SECRET;let status;const res={status(n){status=n;return this;},json(){}};try{requireAuth({get:()=>''},res,()=>assert.fail('must not authorize'));assert.equal(status,503);}finally{process.env.JWT_SECRET=secret;}});
test('rejects login query selectors before any user query',async()=>assert.equal((await request('/api/auth/login','POST',{username:{$ne:null},password:'x'},false)).status,400));
test('validates finite amounts, real dates, months, booleans and update operators',()=>{
 assert.equal(commissionInput(sample).amount,-10);assert.equal(commissionInput({...sample,amount:0}).amount,0);
 for(const p of [{amount:NaN},{amount:Infinity},{amount:'10'},{monthNumber:7},{monthNumber:1.5},{isActive:'false'},{paymentDate:'2024-02-30'},{$set:{amount:0}},{store:''}])assert.throws(()=>commissionInput({...sample,...p}));
 assert.equal(new Record(commissionInput(sample)).validateSync(),undefined);
});
test('notes accept only typed note/status fields',()=>{
 assert.deepEqual(commissionInput({notes:'Checked',suspended:true},true,true),{notes:'Checked',suspended:true});
 assert.throws(()=>commissionInput({amount:10},true,true));assert.throws(()=>commissionInput({suspended:'false'},true,true));
});
test('HTTP validation rejects every invalid upload row, malformed IDs and invalid metadata without writes',async()=>{
 assert.equal((await request('/api/commissions/not-an-id')).status,400);
 assert.equal((await request('/api/commissions/upload','POST',{records:[sample,{...sample,amount:'bad'}]})).status,400);
 assert.equal((await request('/api/uploaded-files','POST',{fileId:'x',filename:'x.csv',recordCount:-1,totalAmount:0})).status,400);
 assert.equal((await request('/api/commissions/backfill-months','POST',{})).status,403);
});
test('update uses an allowlisted $set and runs schema validation',async()=>{
 const original=Record.findByIdAndUpdate;let observed;
 Record.findByIdAndUpdate=async(...args)=>{observed=args;return {_id:args[0],...args[1].$set};};
 try{assert.equal((await request('/api/commissions/'+'b'.repeat(24),'PUT',{amount:25})).status,200);assert.deepEqual(observed[1],{$set:{amount:25}});assert.equal(observed[2].runValidators,true);}finally{Record.findByIdAndUpdate=original;}
});
