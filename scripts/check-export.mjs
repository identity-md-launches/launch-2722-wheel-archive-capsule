import assert from 'node:assert/strict';
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=resolve('.'), dist=resolve('dist');
function files(path) { return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(resolve(path,e.name)):[resolve(path,e.name)]); }
const exported=files(dist);
for(const path of ['index.html','overlay.html','overlay.js','overlay.css','archive-core.js','favicon.svg','share.png','fonts/dm-sans-latin.woff2'])assert.ok(existsSync(resolve(dist,path)),`Missing runtime asset: ${path}`);
for(const file of exported){
  const name=relative(dist,file);assert.ok(!/(^|\/)(node_modules|\.cache|\.npm|vendor)(\/|$)|\.tgz$|\.map$|\.d\.ts$/.test(name),`Unnecessary dependency/cache artifact: ${name}`);
  if(file.endsWith('.html')){
    const html=readFileSync(file,'utf8');
    for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
      if(/^(https?:|data:|#)/.test(url))continue;
      assert.ok(url.startsWith('./'),`Root-relative asset in ${name}: ${url}`);
      assert.ok(existsSync(resolve(dirname(file),url)),`Missing asset in ${name}: ${url}`);
    }
  }
}
const changed=[...new Set(execFileSync('git',['ls-files','-m','-o','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))].filter(p=>!p.startsWith('test/scratch/')&&!p.startsWith('.imd/'));
const forbidden=/^(?:\.git(?:\/|$)|\.github(?:\/|$)|lib(?:\/|$)|foundry\.toml$|foundry\.lock$|remappings\.txt$|\.gitmodules$|package\.json$|package-lock\.json$|vite\.config\.ts$|tsconfig\.json$)|(?:^|\/)node_modules(?:\/|$)|(?:^|\/)\.env(?:\.|$)/;
const trackedChanges=execFileSync('git',['diff','--name-only','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
assert.deepEqual(trackedChanges.filter(p=>forbidden.test(p)),[],'Protected paths changed');
assert.ok(!execFileSync('git',['ls-files','--stage'],{encoding:'utf8'}).split('\n').some(line=>line.startsWith('160000 ')),'A submodule is present');
const addedBytes=changed.filter(p=>existsSync(p)).reduce((n,p)=>n+statSync(p).size,0);
const artifactBytes=existsSync('artifacts')?files(resolve('artifacts')).reduce((n,p)=>n+statSync(p).size,0):0;
assert.ok(addedBytes+artifactBytes<=8388608,`Submission contribution exceeds 8 MiB: ${addedBytes}`);
console.log(JSON.stringify({productionFiles:exported.length,productionBytes:exported.reduce((n,p)=>n+statSync(p).size,0),contributionFiles:changed.filter(p=>existsSync(p)).length,contributionBytes:addedBytes,artifactBytes,combinedBytes:addedBytes+artifactBytes,budgetBytes:8388608,protectedPathsUnchanged:true,submodules:false},null,2));
