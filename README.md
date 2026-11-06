# Controle da Vida Aulufa

Portal Angular para organização da vida e da coleção de board games.

## O Dilema do Rei

Acesse `/#dilema-do-rei` pelo menu. A ficha segue as Crônicas do Reino do manual (edição inglesa, páginas 44–46), com rei, data, casa, pontos de objetivo secreto e público, moedas, poder e total. Digite pontos concedidos, não quantidades de fichas. Totais e posições são calculados, respeitando empates. Prestígio e Cobiça continuam nos escudos conforme as regras do desfecho.

Rascunho e histórico usam a chave localStorage `aulufa-dilema-do-rei-v1`. Use **Baixar arquivo JSON** para guardar um arquivo no computador e **Importar arquivo** para retomar em outro navegador ou dispositivo. Importar substitui a campanha após confirmação; arquivos inválidos são rejeitados. Não há sincronização entre dispositivos. Cada alteração pode ser recuperada ao reabrir a página. O histórico permite editar e excluir partidas.

Verificação da pontuação e do formato de arquivo: `node scripts/check-dilema.mjs`.

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

