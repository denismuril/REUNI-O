# Guia Rapido de Deploy

Use [DEPLOY_LINUX.md](DEPLOY_LINUX.md) como guia principal.

Arquivos prontos no repositorio:

- `ecosystem.config.js`: processo PM2 para subir a app em `127.0.0.1:3000`
- `deploy/nginx/reuniao.bexp.com.br.conf`: vhost Nginx para `reuniao.bexp.com.br`
- `app/api/health/route.ts`: endpoint de validacao em `/api/health`

Checklist minimo:

```bash
npm install
npm run build
pm2 start ecosystem.config.js
curl -i http://127.0.0.1:3000/api/health
```

Nao configure um `location /api/` separado para outro backend no mesmo dominio. Isso quebraria `/api/auth/*` do NextAuth.
