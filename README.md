# Voto Live

Arena interativa de votos para TikTok Live. O painel React funciona de forma independente para testes locais; `server/` oferece um adaptador opcional que conecta `tiktok-live-connector` pelo backend Node, encaminhando apenas presentes Rose para o navegador via WebSocket.

## Executar

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite. Para conectar a uma live, rode em outro terminal:

```bash
TIKTOK_USERNAME=seu_usuario npm run server
```

O conector requer o nome de usuário público do criador que está ao vivo. Configure `TIKTOK_USERNAME` com esse usuário antes de iniciar o servidor. O adaptador escuta presentes `Rose` e publica eventos JSON em `ws://localhost:3001/live`; `http://localhost:3001/health` mostra o estado da conexão. O browser React já reconecta ao WebSocket automaticamente.

Por padrão, rosas vão para o lado 22. Você pode enviar os usuários selecionados ao lado 22 com `SIDE_22_USERS=nome1,nome2`; rosas de outros usuários serão atribuídas ao lado 13. Configure essa regra de acordo com a dinâmica da sua live. No PowerShell:

```powershell
$env:TIKTOK_USERNAME = "seu_usuario"
$env:SIDE_22_USERS = "usuario_azul1,usuario_azul2"
npm run server
```

O servidor filtra rosas pelo nome do presente e trata sequências de presentes sem contar atualizações intermediárias duas vezes. Cada evento enviado tem `type`, `side`, `quantity`, `username`, `giftName`, `giftId` e `timestamp`.

> `tiktok-live-connector` é uma integração de terceiros não oficial. Eventos e disponibilidade podem mudar; mantenha credenciais e conexão no backend. O navegador se conecta a `ws://localhost:3001/live` sem expor a conexão do TikTok.

## Estrutura

- `src/`: dashboard, placar, urna animada, controles locais e cliente WebSocket.
- `server/index.js`: conexão com TikTok Live, filtro de Rose e retransmissão WebSocket.
- Sem variáveis de servidor, a interface fica em modo demonstração e os botões do painel atualizam a partida localmente.

## Publicar a interface no Netlify

O arquivo `netlify.toml` já configura `npm run build` e a pasta `dist`. Importe o repositório no Netlify e publique o site. Defina `VITE_LIVE_WS_URL` nas variáveis de ambiente do site com o endereço seguro do adaptador Node, por exemplo `wss://seu-adaptador.example.com/live`, e faça um novo deploy. Copie esse endereço para `.env` local se quiser apontar o dev server para o adaptador hospedado.

O adaptador TikTok é um processo Node persistente e deve ser hospedado separadamente em um serviço que aceite WebSockets. O Netlify serve a interface estática; não execute `npm run server` dentro de uma função serverless do Netlify esperando que uma conexão WebSocket permaneça ativa.

O arquivo `render.yaml` define um serviço web gratuito no Render, com health check em `/health` e `TIKTOK_USERNAME=t.hetaxman`. Quando implantado, o backend tenta conectar-se à sala LIVE pública dessa conta para receber eventos; ele não inicia nem transmite uma live. Troque o valor na configuração se for monitorar outra conta.

## Usar no TikTok LIVE Studio

Depois que a URL pública do Netlify estiver no ar, adicione uma fonte **Browser / Navegador** à cena e informe a URL HTTPS do site. Ajuste a largura e a altura conforme o canvas da live, posicione o placar na cena e deixe a fonte visível. Teste primeiro com os botões do painel local e depois com uma Rose real, com o adaptador Node conectado. A interface precisa acessar o adaptador por `wss://` para receber presentes dentro de uma página HTTPS.
