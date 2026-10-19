# Controle da Vida Aulufa

Portal Angular para organização da vida e da coleção de board games.

## Executar

```bash
npm install
npm start
```

## Conexão com o Home Assistant

A página **Casa inteligente** usa o OAuth do Home Assistant para mostrar e controlar luzes, interruptores, tomadas, ventiladores e persianas. A sessão OAuth fica no `sessionStorage` do navegador e é revogada ao desconectar; nenhuma credencial é incorporada ao código ou enviada à Vercel.

Para permitir que o navegador do site converse com a instância, adicione as origens do portal ao bloco `http` do `configuration.yaml` do Home Assistant e reinicie o Home Assistant:

```yaml
http:
  cors_allowed_origins:
    - https://site-teste-two-iota.vercel.app
    - http://localhost:4200
    - http://127.0.0.1:4200
```

Se já existir um bloco `http:`, acrescente `cors_allowed_origins` nele em vez de criar um segundo. No portal, conecte usando um endereço HTTPS acessível do Home Assistant (por exemplo, a URL externa do Home Assistant Cloud). Para desenvolvimento local, um endereço HTTP na rede local pode ser usado com `localhost`.

