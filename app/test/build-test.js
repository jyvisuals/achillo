const esbuild=require('esbuild'),path=require('path'),fs=require('fs');
esbuild.buildSync({entryPoints:[path.join(__dirname,'../src/native.js')],bundle:true,format:'iife',outfile:path.join(__dirname,'out/native.js'),
 alias:{'@capacitor/core':path.join(__dirname,'stubs/core.js'),'@capacitor/local-notifications':path.join(__dirname,'stubs/ln.js'),'@capacitor/app':path.join(__dirname,'stubs/app.js'),'@capacitor/haptics':path.join(__dirname,'stubs/haptics.js'),'@capacitor/share':path.join(__dirname,'stubs/share.js'),'@capacitor/filesystem':path.join(__dirname,'stubs/fs.js')}});
fs.copyFileSync(path.join(__dirname,'../www/index.html'),path.join(__dirname,'out/index.html'));
console.log('test bundle ok');
