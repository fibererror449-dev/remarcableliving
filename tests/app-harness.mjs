import { Miniflare } from 'miniflare';
import { readFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Runs the built Worker (npm run build) with local D1/R2 and static assets, as Sites would, so browser and
// public-page tests exercise the real routes. Modules are listed explicitly because the
// bundle lazy-loads chunks through dynamic imports Miniflare cannot trace.
export async function appHarness(bindings={}) {
  const server=resolve('dist/server');
  const files=(await readdir(server,{recursive:true})).filter(f=>f.endsWith('.js')).map(f=>resolve(server,f));
  const modules=[resolve(server,'index.js'),...files.filter(f=>f!==resolve(server,'index.js'))].map(path=>({type:'ESModule',path}));
  const mf=new Miniflare({modules,modulesRoot:server,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['MEDIA'],bindings:{ADMIN_EMAILS:'admin@example.test',IMPORTS_ENABLED:'1',...bindings},
    assets:{directory:resolve('dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true}}});
  try {
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))await db.prepare(sql).run();
    return {mf,url:String(await mf.ready).replace(/\/$/,''),close:()=>mf.dispose()};
  } catch(error) {await mf.dispose();throw error;}
}
