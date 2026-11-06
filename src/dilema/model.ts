export interface HouseScore { id: string; house: string; secret: number | null; open: number | null; coins: number | null; power: number | null; }
export interface Reign { id: string; king: string; date: string; ending: string; notes: string; houses: HouseScore[]; }
export interface Chronicle { format: 'aulufa-dilema-do-rei'; version: 1; campaign: string; games: Reign[]; draft: Reign; }
export const endings = ['Em andamento', 'Morte do rei', 'Abdicação — estabilidade alta', 'Abdicação — estabilidade baixa'];
export const newHouse = (): HouseScore => ({ id: crypto.randomUUID(), house: '', secret: 0, open: 0, coins: 0, power: 0 });
export function newReign(houses?: HouseScore[]): Reign {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return { id: crypto.randomUUID(), king: '', date, ending: endings[0], notes: '', houses: houses ? houses.map(h => ({ ...newHouse(), house: h.house })) : Array.from({length: 3}, newHouse) };
}
export const newChronicle = (): Chronicle => ({format: 'aulufa-dilema-do-rei', version: 1, campaign: 'Crônicas de Ankist', games: [], draft: newReign()});
export const total = (h: HouseScore): number => (h.secret ?? 0) + (h.open ?? 0) + (h.coins ?? 0) + (h.power ?? 0);
export const rank = (h: HouseScore, houses: HouseScore[]): number => 1 + houses.filter(other => total(other) > total(h)).length;
export function validateChronicle(data: unknown): Chronicle {
  const fail = (): never => { throw new Error('Arquivo inválido. Escolha um JSON exportado pelas Crônicas do Reino.'); };
  const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  const str = (x: unknown, max: number): x is string => typeof x === 'string' && x.length <= max;
  const number = (x: unknown): boolean => typeof x === 'number' && Number.isSafeInteger(x) && Math.abs(x) <= 10000;
  const reign = (x: unknown): x is Reign => {
    if (!record(x) || !str(x['id'],100) || !x['id'] || !str(x['king'],120) || !str(x['date'],10) || !/^\d{4}-\d{2}-\d{2}$/.test(x['date']) || !Number.isFinite(Date.parse(x['date'])) || new Date(x['date']).toISOString().slice(0,10) !== x['date'] || !str(x['notes'],5000) || !endings.includes(x['ending'] as string) || !Array.isArray(x['houses']) || x['houses'].length < 3 || x['houses'].length > 5) return false;
    return x['houses'].every(h => record(h) && str(h['id'],100) && h['id'] && str(h['house'],80) && ['secret','open','coins','power'].every(k => h[k] === null || number(h[k]))) && new Set(x['houses'].map(h => h['id'])).size === x['houses'].length;
  };
  if (!record(data) || data['format'] !== 'aulufa-dilema-do-rei' || data['version'] !== 1 || !str(data['campaign'],120) || !Array.isArray(data['games']) || data['games'].length > 1000 || !data['games'].every(reign) || !reign(data['draft']) || new Set(data['games'].map(g => g.id)).size !== data['games'].length) return fail();
  return structuredClone(data) as unknown as Chronicle;
}
