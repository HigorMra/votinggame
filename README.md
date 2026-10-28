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

O x1 inicia com Erika Hilton (esquerda) e Nikolas Ferreira (direita). Use os menus nas cartas para escolher entre os nomes cadastrados em cada espectro. A troca de qualquer candidato reinicia o placar da rodada para não atribuir apoios antigos ao novo nome. Cada Rosa vira um apoio no placar da live; o número eleitoral informado aparece separado como referência.

Na live, cada espectador pode escrever `ESQUERDA` ou `DIREITA` no chat antes de enviar a Rosa. A escolha fica vinculada ao usuário e vale para os próximos presentes. Sem comando prévio, a Rosa vai para a esquerda. Se quiser fixar lados para usuários específicos, `SIDE_LEFT_USERS` e `SIDE_RIGHT_USERS` têm prioridade sobre o comando do chat. No PowerShell:

```powershell
$env:TIKTOK_USERNAME = "seu_usuario"
$env:SIDE_LEFT_USERS = "usuario_esquerda1,usuario_esquerda2"
npm run server
```

O servidor filtra rosas pelo nome do presente e trata sequências de presentes sem contar atualizações intermediárias duas vezes. Cada evento enviado tem `type`, `side` (`left` ou `right`), `quantity`, `username`, `giftName`, `giftId` e `timestamp`.

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

Depois que a URL pública do Netlify estiver no ar, adicione uma fonte **Browser / Navegador** à cena e informe a URL HTTPS do site. Ajuste a largura e a altura conforme o canvas da live e posicione o placar na cena. A página hospedada se conecta sozinha ao WebSocket do Render. Teste as animações com os botões do painel; uma Rose real só atualizará o placar quando a conta `t.hetaxman` estiver ao vivo e o conector estiver conectado. Isso prepara a fonte e o receptor sem iniciar ou publicar uma transmissão.
