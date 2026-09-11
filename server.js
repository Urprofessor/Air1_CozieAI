const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.otf':'font/otf','.svg':'image/svg+xml','.webp':'image/webp'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const fp=path.join(root,p);
  fs.readFile(fp,(e,d)=>{
    if(e){res.writeHead(404);res.end('404 '+p);return;}
    res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});
    res.end(d);
  });
}).listen(5178,()=>console.log('serving on http://localhost:5178'));
