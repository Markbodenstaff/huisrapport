import {readFile,writeFile,mkdir} from 'node:fs/promises';
const assets={};for(const [name,type] of [['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['report.js','text/javascript; charset=utf-8'],['data.js','text/javascript; charset=utf-8'],['styles.css','text/css; charset=utf-8'],['interest.js','text/javascript; charset=utf-8']])assets['/'+name]={body:await readFile('public/'+name,'utf8'),type};
const handler=await readFile('worker/handler.js','utf8');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',handler+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handle(request,env,assets);}};\n');
try {
 await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json','utf8'));
} catch(error) {
 if(error.code !== 'ENOENT') throw error;
 console.log('Geen lokale Sites-koppeling: alleen de website-Worker gebouwd.');
}
console.log('Worker met website en interesseformulier gebouwd.');
