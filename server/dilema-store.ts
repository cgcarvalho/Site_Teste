import { createHash } from 'node:crypto';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { validateChronicle } from '../src/dilema/model.js';

type Storage = { get: typeof get; put: typeof put; configured: () => boolean; defaultHash?: () => string | undefined };
const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, extra: Record<string,string> = {}) => Response.json(body, { status, headers: {...headers,...extra} });
const MAX_BYTES = 2_000_000;

export function campaignHandler(storage: Storage = {get,put,configured: () => !!(process.env['BLOB_STORE_ID'] || process.env['BLOB_READ_WRITE_TOKEN']),defaultHash: () => process.env['DILEMA_DEFAULT_CAMPAIGN_HASH']}) {
  return async (request: Request): Promise<Response> => {
    if (!['GET','PUT'].includes(request.method)) return json({error:'Método não permitido.'},405,{Allow:'GET, PUT'});
    const token = request.headers.get('Authorization')?.replace(/^Bearer /,'') ?? '';
    const validToken = /^[a-f0-9]{64}$/.test(token);
    const defaultView = request.method === 'GET' && new URL(request.url).searchParams.get('default') === '1';
    if (!defaultView && !validToken) return json({error:'Link da campanha inválido.'},401);
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json({error:'Origem não permitida.'},403);
    if (!storage.configured()) return json({error:'O armazenamento permanente ainda não está configurado.'},503);
    const tokenHash = validToken ? createHash('sha256').update(token).digest('hex') : '';
    const campaignHash = defaultView ? storage.defaultHash?.() : tokenHash;
    if (!campaignHash || !/^[a-f0-9]{64}$/.test(campaignHash)) return json({error:'A campanha principal ainda não está configurada.'},503);
    const canEdit = validToken && tokenHash === campaignHash;
    const path = `dilema/v1/${campaignHash}.json`;
    try {
      if (request.method === 'GET') {
        const result = await storage.get(path,{access:'private',useCache:false});
        if (!result || result.statusCode !== 200) return json({error:'Campanha ainda não salva.'},404);
        const content = await new Response(result.stream).json();
        return json({...content,canEdit},200,{ETag:result.blob.etag});
      }
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Envie um arquivo JSON.'},415);
      const revision = request.headers.get('If-Match');
      const create = request.headers.get('If-None-Match') === '*';
      if ((!revision && !create) || (revision && create)) return json({error:'Informe a revisão da campanha.'},428);
      if (revision && (revision.length > 200 || !/^"[^"\r\n]+"$/.test(revision))) return json({error:'Revisão inválida.'},400);
      if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return json({error:'Campanha muito grande.'},413);
      const reader = request.body?.getReader();
      if (!reader) return json({error:'Campanha vazia.'},400);
      const chunks: Uint8Array[] = []; let length = 0;
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > MAX_BYTES) { await reader.cancel(); return json({error:'Campanha muito grande.'},413); }
        chunks.push(chunk.value);
      }
      let data;
      try { data = validateChronicle(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { return json({error:'Dados da campanha inválidos. A versão anterior foi preservada.'},400); }
      const savedAt = new Date().toISOString();
      const result = await storage.put(path,JSON.stringify({data,savedAt}),{
        access:'private', addRandomSuffix:false, contentType:'application/json',
        ...(revision ? {allowOverwrite:true,ifMatch:revision} : {allowOverwrite:false}),
      });
      return json({savedAt},200,{ETag:result.etag});
    } catch (error) {
      // SDK versions may report an existing object through BlobUnknownError.
      if (error instanceof BlobPreconditionFailedError || (error instanceof Error && /already exists|precondition/i.test(error.message))) return json({error:'A campanha foi alterada em outra sessão. Recarregue a versão salva antes de editar.'},409);
      return json({error:'Não foi possível acessar o arquivo permanente. Seus dados locais foram preservados.'},503);
    }
  };
}
