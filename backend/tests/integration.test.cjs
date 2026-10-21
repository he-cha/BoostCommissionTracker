const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {MongoMemoryServer}=require('mongodb-memory-server');
const app=require('../dist/app').default;
const User=require('../dist/models/User').default;
const Record=require('../dist/models/CommissionRecord').default;
const {commissionInput}=require('../dist/middleware/validation');
let db,server,base,token;
const secret='test-only-secret-that-is-not-a-deployment-credential-123456';
const sample={imei:'123456789012345',store:'Demo store',amount:42.5,activationDate:'2024-01-01',paymentDate:'2024-02-01',monthNumber:1,isActive:true};
async function request(path,method='GET',body,credential=token){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(credential?{Authorization:'Bearer '+credential}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 return {status:response.status,body:await response.json()};
}
before(async()=>{
 process.env.JWT_SECRET=secret;
 db=await MongoMemoryServer.create();await mongoose.connect(db.getUri());
 await User.create({username:'demo',password:await bcrypt.hash('test-password',4)});
 server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base='http://127.0.0.1:'+server.address().port;
 const login=await request('/api/auth/login','POST',{username:'demo',password:'test-password'},null);assert.equal(login.status,200);token=login.body.token;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();if(db)await db.stop();});
test('health remains public; all commission, metadata and maintenance routes require a session',async()=>{
 assert.equal((await request('/api/health','GET',undefined,null)).status,200);
 for(const [path,method,body]of [['/api/commissions','GET'],['/api/commissions','POST',sample],['/api/commissions/upload','POST',{records:[sample]}],['/api/commissions/backfill-months','POST',{}],['/api/commissions/imei/123/notes','PUT',{notes:'x'}],['/api/uploaded-files','GET'],['/api/uploaded-files','POST',{}],['/api/uploaded-files/f1','DELETE']])assert.equal((await request(path,method,body,null)).status,401);
});
test('rejects malformed, expired, incorrectly signed and incomplete tokens',async()=>{
 for(const bad of ['garbage',jwt.sign({userId:'a'.repeat(24)},secret,{expiresIn:-1}),jwt.sign({userId:'a'.repeat(24)},'another-test-secret',{expiresIn:'1h'}),jwt.sign({username:'demo'},secret,{expiresIn:'1h'}),jwt.sign({userId:'a'.repeat(24)},secret)])assert.equal((await request('/api/commissions','GET',undefined,bad)).status,401);
});
test('rejects selector injection at login',async()=>assert.equal((await request('/api/auth/login','POST',{username:{$ne:null},password:'x'},null)).status,400));
test('authenticated CRUD persists and validates updates',async()=>{
 const created=await request('/api/commissions','POST',sample);assert.equal(created.status,201);
 const id=created.body._id;
 assert.equal((await request('/api/commissions/'+id)).status,200);
 assert.equal((await request('/api/commissions/'+id,'PUT',{amount:-12.5})).body.amount,-12.5);
 assert.equal((await request('/api/commissions/'+id,'PUT',{amount:'not-a-number'})).status,400);
 assert.equal((await Record.findById(id)).amount,-12.5);
 assert.equal((await request('/api/commissions/'+id,'DELETE')).status,200);
 assert.equal((await request('/api/commissions/'+id)).status,404);
});
test('invalid payloads do not create records',async()=>{
 const before=await Record.countDocuments();
 for(const body of [{...sample,amount:null},{...sample,monthNumber:7},{...sample,isActive:'false'},{...sample,paymentDate:'2024-02-30'},{...sample,store:''},{...sample,$set:{amount:10}}])assert.equal((await request('/api/commissions','POST',body)).status,400);
 assert.equal(await Record.countDocuments(),before);
 assert.throws(()=>commissionInput({...sample,amount:Infinity}));
});
test('invalid IDs and notes types are rejected',async()=>{
 assert.equal((await request('/api/commissions/not-a-mongo-id')).status,400);
 const created=await request('/api/commissions','POST',sample);
 assert.equal((await request('/api/commissions/imei/'+sample.imei+'/notes','PUT',{blacklisted:'false'})).status,400);
 assert.equal((await request('/api/commissions/imei/'+sample.imei+'/notes','PUT',{notes:'Reviewed',blacklisted:true})).status,200);
 const notes=await request('/api/commissions/imei/'+sample.imei+'/notes');assert.equal(notes.body.notes,'Reviewed');assert.equal(notes.body.blacklisted,true);
 await Record.findByIdAndDelete(created.body._id);
});
test('validates all upload rows before writing',async()=>{
 const before=await Record.countDocuments();
 assert.equal((await request('/api/commissions/upload','POST',{records:[sample,{...sample,amount:'oops'}]})).status,400);
 assert.equal(await Record.countDocuments(),before);
 assert.equal((await request('/api/commissions/upload','POST',{records:[{...sample,fileId:'test-file'}]})).status,201);
});
test('file metadata validation and file deletion remove matching records only',async()=>{
 assert.equal((await request('/api/uploaded-files','POST',{fileId:'x',filename:'x.csv',recordCount:-1,totalAmount:1})).status,400);
 const result=await request('/api/uploaded-files','POST',{fileId:'test-file',filename:'synthetic.csv',recordCount:1,totalAmount:42.5});assert.equal(result.status,201);
 assert.equal((await request('/api/uploaded-files/test-file','DELETE')).status,200);
 assert.equal(await Record.countDocuments({fileId:'test-file'}),0);
});
test('maintenance is disabled by default',async()=>assert.equal((await request('/api/commissions/backfill-months','POST',{})).status,403));
test('fails closed when secret is unset',async()=>{
 delete process.env.JWT_SECRET;
 try{assert.equal((await request('/api/commissions')).status,503);assert.equal((await request('/api/auth/login','POST',{username:'demo',password:'test-password'},null)).status,503);}
 finally{process.env.JWT_SECRET=secret;}
});
