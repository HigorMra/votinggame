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

O x1 sorteia um candidato de cada espectro ao abrir e gera um novo confronto a cada cinco minutos, sem repetir o mesmo par em rodadas consecutivas. A troca automática zera o placar; não há seletor de candidatos na tela. Cada Rosa vira um apoio no placar, enquanto os votos eleitorais aparecem separados como referência. As 52 fotos são retratos oficiais das candidaturas de 2026 publicados pelo TSE e ficam em `public/candidates/`.

Na live, cada espectador pode escrever `ESQUERDA` ou `DIREITA` no chat antes de enviar a Rosa. A escolha fica vinculada ao usuário e vale para as próximas rosas. Sem comando prévio, a Rosa vai para a esquerda. Os nomes em `SIDE_LEFT_USERS` e `SIDE_RIGHT_USERS` podem ser fixados para um lado e têm prioridade sobre o comando do chat. No PowerShell:

```powershell
$env:TIKTOK_USERNAME = "seu_usuario"
$env:SIDE_LEFT_USERS = "usuario_esquerda1,usuario_esquerda2"
$env:SIDE_RIGHT_USERS = "usuario_direita1,usuario_direita2"
npm run server
```

O servidor filtra rosas pelo nome do presente e trata sequências de presentes sem contar atualizações intermediárias duas vezes. Cada evento enviado tem `type`, `side` (`left` ou `right`), `quantity`, `username`, `giftName`, `giftId` e `timestamp`. Clicar em uma urna também anima uma flor e acrescenta um apoio local para demonstrar o efeito.

O arquivo `public/audio/funk-da-urna-2026.mp3` é reproduzido em loop pelo overlay. Para tentar iniciar automaticamente na fonte do LIVE Studio, use a URL com `?audio=1` e habilite o áudio da fonte. Se o navegador bloquear autoplay, abra **CONTROLES**, clique em **ATIVAR FUNK EM LOOP** e ajuste o volume.

> `tiktok-live-connector` é uma integração de terceiros não oficial. Eventos e disponibilidade podem mudar; mantenha credenciais e conexão no backend. O navegador se conecta a `ws://localhost:3001/live` sem expor a conexão do TikTok.

## Estrutura

- `src/`: dashboard, placar, urna animada, controles locais e cliente WebSocket.
- `server/index.js`: conexão com TikTok Live, filtro de Rose e retransmissão WebSocket.
- Sem variáveis de servidor, a interface fica em modo demonstração e os botões do painel atualizam a partida localmente.

## Publicar a interface no Netlify

O arquivo `netlify.toml` configura `npm run build`, a pasta `dist`, o WebSocket seguro do Render (`wss://voto-live-adapter.onrender.com/live`) e a conexão automática da fonte hospedada. Importe `HigorMra/votinggame` no Netlify e publique o site. O browser aberto no LIVE Studio se conectará ao backend automaticamente; localmente, a tela continua em modo demonstração até você conectar manualmente.

O adaptador TikTok é um processo Node persistente e deve ser hospedado separadamente em um serviço que aceite WebSockets. O Netlify serve a interface estática; não execute `npm run server` dentro de uma função serverless do Netlify esperando que uma conexão WebSocket permaneça ativa.

O arquivo `render.yaml` define um serviço web gratuito no Render, com health check em `/health` e `TIKTOK_USERNAME=t.hetaxman`. Quando implantado, o backend tenta conectar-se à sala LIVE pública dessa conta para receber eventos; ele não inicia nem transmite uma live. Troque o valor na configuração se for monitorar outra conta.

## Usar no TikTok LIVE Studio

Depois que a URL pública do Netlify estiver no ar, adicione uma fonte **Browser / Navegador** à cena e informe `https://prismatic-chaja-b3562e.netlify.app/?audio=1`. Ajuste a largura e a altura conforme o canvas da live e posicione o placar na cena. Habilite o áudio dessa fonte para transmitir o funk. Se autoplay for bloqueado, abra **CONTROLES** na fonte e clique em **ATIVAR FUNK EM LOOP**. A página hospedada se conecta sozinha ao WebSocket do Render. Teste as animações com os botões do painel; uma Rose real só atualizará o placar quando a conta `t.hetaxman` estiver ao vivo e o conector estiver conectado. Isso prepara a fonte e o receptor sem iniciar ou publicar uma transmissão.
