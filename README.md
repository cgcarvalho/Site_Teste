# Controle da Vida Aulufa

Portal Angular para organização da vida e da coleção de board games.

## O Dilema do Rei

Acesse `/#dilema-do-rei` pelo menu. A ficha segue as Crônicas do Reino do manual (edição inglesa, páginas 44–46), com rei, data, casa, pontos de objetivo secreto e público, moedas, poder e total. Digite pontos concedidos, não quantidades de fichas. Totais e posições são calculados, respeitando empates. Prestígio e Cobiça continuam nos escudos conforme as regras do desfecho.

Rascunho e histórico são salvos automaticamente em arquivo JSON privado no Vercel Blob. A API `/api/dilema` recupera a campanha ao abrir a página e grava alterações após um segundo de inatividade. Use **Copiar link da campanha** para consultar e editar o mesmo histórico em outro dispositivo; guarde esse link nos favoritos. O link contém uma chave aleatória de 256 bits no fragmento e concede acesso à campanha. Não há lista pública de campanhas. O servidor usa o hash SHA-256 da chave para localizar o arquivo privado.

As revisões ETag impedem que uma sessão antiga sobrescreva alterações de outra. Em caso de conflito, baixe o JSON local antes de usar **Carregar do site**. Alterações offline continuam na chave localStorage `aulufa-dilema-do-rei-v1` e são enviadas ao reconectar se a versão remota não mudou. A chave/revisão e o indicador de alterações pendentes ficam em `aulufa-dilema-cloud-v1`. A primeira abertura da nova versão migra os dados locais existentes automaticamente.

Use **Baixar arquivo JSON** para manter também uma cópia no computador. **Importar arquivo** substitui a campanha após confirmação; arquivos inválidos são rejeitados. O histórico permite editar e excluir partidas. O servidor precisa de `BLOB_READ_WRITE_TOKEN` ou `BLOB_STORE_ID` com credenciais OIDC, exclusivamente no ambiente da função, conectado a um store privado. Sem configuração ou rede, a interface informa a falha e preserva a cópia local.

Verificações: `node scripts/check-dilema.mjs`, `node scripts/check-dilema-cloud.mjs`, `npx tsc -p tsconfig.server.json` e `npm run build`.

## Executar

```bash
npm install
npm start
```

## Conexão com o Home Assistant

A página **Casa inteligente** usa o OAuth do Home Assistant para mostrar e controlar luzes, interruptores, tomadas, ventiladores e persianas. A sessão OAuth fica no `sessionStorage` do navegador e é revogada ao desconectar; nenhuma credencial é incorporada ao código ou enviada à Vercel.

Para permitir que o navegador do site converse com a instância, adicione a origem do portal em **Configurações → Sistema → Rede → Servidor HTTP → Origens CORS permitidas**. Salve as alterações e confirme o reinício do Home Assistant:

```yaml
http:
  cors_allowed_origins:
    - https://site-teste-two-iota.vercel.app
    - http://localhost:4200
    - http://127.0.0.1:4200
```

Em instalações anteriores ao Home Assistant 2026.8, configure as mesmas origens no bloco `http` do `configuration.yaml`. Se já existir um bloco `http:`, acrescente `cors_allowed_origins` nele em vez de criar um segundo. No portal publicado, conecte usando um endereço HTTPS acessível (por exemplo, a URL externa do Home Assistant Cloud). Para desenvolvimento local, um endereço HTTP na rede local pode ser usado com `localhost`.

