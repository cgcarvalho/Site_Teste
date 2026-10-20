import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const allowedTypes = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export function GET(): Response {
  return Response.json({ error: 'Método não permitido.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'O armazenamento de apresentações ainda não foi conectado ao projeto Vercel.' }, { status: 503 });
  }

  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, _clientPayload, multipart) => {
        const configuredPassword = process.env.PRESENTATION_UPLOAD_PASSWORD;
        const suppliedPassword = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!configuredPassword || !suppliedPassword || suppliedPassword !== configuredPassword) {
          throw new Error('Senha de publicação inválida ou ainda não configurada.');
        }

        if (!pathname.startsWith('apresentacoes/') || !/\.(ppt|pptx)$/i.test(pathname)) {
          throw new Error('Envie um arquivo PowerPoint .ppt ou .pptx.');
        }

        return {
          allowedContentTypes: allowedTypes,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: multipart ? 'powerpoint-multipart' : 'powerpoint'
        };
      }
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível preparar o envio.';
    const status = /senha de publicação inválida/i.test(message) ? 401 : /powerpoint/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

