import {writeFile} from 'node:fs/promises';
const raw=process.env.MGTV_STAGING_API_ORIGIN;let url;
try{url=new URL(raw);}catch{throw Error('Set MGTV_STAGING_API_ORIGIN to the backend HTTPS origin, without /api/v1.');}
if(url.protocol!=='https:'||url.origin!==raw||url.username||url.password||url.port)throw Error('Use an exact HTTPS API origin, without credentials, a path or custom port.');
const config={buildCommand:'npm run build',outputDirectory:'dist',framework:'vite',rewrites:[{source:'/api/:path*',destination:url.origin+'/api/:path*'},{source:'/(.*)',destination:'/index.html'}]};
await writeFile('vercel.json',JSON.stringify(config,null,2)+'\n');console.log('Wrote Vercel API proxy and SPA routing; review vercel.json before deployment.');
