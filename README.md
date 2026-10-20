# Controle da Vida Aulufa

Portal Angular para organização da vida e da coleção de board games.

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

## Apresentador de slides

A página **Apresentador de slides** recebe arquivos `.ppt` e `.pptx` e gera um link compartilhável usando o visualizador online do Office. Os arquivos são enviados diretamente do navegador para o Vercel Blob por upload multipart; a chave de armazenamento não é exposta ao cliente.

Para ativar o envio, conecte um armazenamento **Blob público** ao projeto Vercel, garantindo `BLOB_READ_WRITE_TOKEN` no ambiente de produção, e crie a variável criptografada `PRESENTATION_UPLOAD_PASSWORD`. Informe essa senha no formulário para receber um token de envio restrito a arquivos PowerPoint de até 100 MB. O arquivo fica público para quem tiver sua URL, condição necessária para o visualizador incorporado.

