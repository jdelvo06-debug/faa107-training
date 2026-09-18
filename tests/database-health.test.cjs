const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('lib/database-health.ts','utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod = {exports:{}};
new Function('exports','require','module',compiled)(mod.exports,require,mod);
const {databaseHealth} = mod.exports;
const env = {CRON_SECRET:'test-secret',NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test-key'};
const request = (auth='Bearer test-secret') => new Request('https://example.test/api/cron/database-health',{headers:{authorization:auth}});
const good = () => Response.json([{id:1,marker:'faa107-ok'}]);
const log = () => {};

test('unauthorized and missing config never query the database', async()=>{
  for(const [config,auth,status] of [[env,'wrong',401],[{...env,CRON_SECRET:undefined},'Bearer undefined',503],[{...env,NEXT_PUBLIC_SUPABASE_URL:undefined},'Bearer test-secret',503],[{...env,NEXT_PUBLIC_SUPABASE_URL:'bad url'},'Bearer test-secret',503]]) {
    const response=await databaseHealth(request(auth),{env:config,log,fetch:()=>{throw new Error('must not fetch');}});
    assert.equal(response.status,status);
  }
});
test('queries only health marker, without cache or learner credentials, and logs no secrets',async()=>{
  const logs=[];
  const response=await databaseHealth(request(),{env,log:e=>logs.push(e),fetch:async(url,options)=>{
    assert.equal(url.pathname,'/rest/v1/faa107_healthcheck');
    assert.equal(url.searchParams.get('id'),'eq.1');
    assert.equal(options.cache,'no-store');
    assert.deepEqual(options.headers,{apikey:'public-test-key'});
    assert.ok(options.signal instanceof AbortSignal);
    return good();
  }});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(logs[0].attempts,1);
  assert.doesNotMatch(JSON.stringify(logs),/test-secret|public-test-key/);
});
test('retries transient HTTP errors once; never retries permanent errors',async()=>{
  for(const status of [429,500,502,503,401,403,404]) {
    let calls=0;
    const response=await databaseHealth(request(),{env,log,fetch:async()=>++calls===1?new Response('',{status}):good()});
    assert.equal(calls,status===429||status>=500?2:1);
    assert.equal(response.status,calls===2?200:503);
  }
});
test('network failures and timeouts have exactly two attempts with fresh signals',async()=>{
  for(const failure of ['network','timeout']) {
    const signals=[];
    const response=await databaseHealth(request(),{env,log,signal:()=>{const s=AbortSignal.abort();signals.push(s);return s;},fetch:async()=>{throw new DOMException(failure,failure==='timeout'?'TimeoutError':'NetworkError');}});
    assert.equal(response.status,503);
    assert.equal(signals.length,2);
    assert.notEqual(signals[0],signals[1]);
  }
});
test('rejects missing, wrong, duplicated and malformed markers without retry',async()=>{
  for(const rows of [[],[{id:2,marker:'faa107-ok'}],[{id:1,marker:'wrong'}],[{id:1,marker:'faa107-ok'},{id:1,marker:'faa107-ok'}],null,'invalid-json']) {
    let calls=0;
    const response=await databaseHealth(request(),{env,log,fetch:async()=>{calls++;return rows==='invalid-json'?new Response('{'):Response.json(rows);}});
    assert.equal(response.status,503);assert.equal(calls,1);
  }
});
