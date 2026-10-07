# Welcome to your AI Studio project

This project was built with AI Studio.

## Development

Prefer working locally? You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Backend del chatbot

`POST /api/chat` recibe JSON con `session_id` (máximo 128 caracteres) y `mensaje`
(máximo 4000 caracteres). Ambos deben ser strings no vacíos. El cuerpo está limitado
a 16 KiB. El servidor reenvía únicamente esos campos al webhook de Make y responde
`{ "respuesta_bot": "..." }`. Make puede responder JSON con un campo de texto
`respuesta_bot`, `respuesta`, `response`, `message` o `text`, o texto plano UTF-8.
En Make, el módulo **Webhook response** debe ejecutarse después del agente y devolver
el texto generado (preferiblemente JSON con `respuesta_bot`). La respuesta genérica
`Accepted` indica que Make recibió el evento, pero no devolvió todavía el texto del agente.

Configura `MAKE_CHAT_WEBHOOK_URL` solo en el entorno del servidor; no uses una variable
`VITE_*` ni incluyas la URL en el código. Para el servidor de desarrollo Vite/Nitro, usa
`.env.local` (ignorado por Git). En Cloudflare, guárdala como secreto con
`wrangler secret put MAKE_CHAT_WEBHOOK_URL`. Si falta la configuración, el endpoint devuelve
`503`. El navegador llama al endpoint del mismo origen y nunca recibe la URL de Make.
