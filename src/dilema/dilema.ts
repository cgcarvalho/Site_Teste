import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chronicle, HouseScore, Reign, endings, newChronicle, newHouse, newReign, rank, total, validateChronicle } from './model';

@Component({selector: 'app-dilema', standalone: true, imports: [FormsModule], templateUrl: './dilema.html', styleUrl: './dilema.css'})
export class DilemaComponent implements OnDestroy {
  readonly key = 'aulufa-dilema-do-rei-v1';
  data: Chronicle = newChronicle();
  readonly endings = endings;
  total = total;
  rank = rank;
  message = '';
  storageStatus = '';
  storageBlocked = false;
  editingId = '';
  cloudStatus = 'Conectando ao arquivo permanente…';
  cloudReady = false;
  cloudBusy = false;
  cloudConflict = false;
  private cloudKey = '';
  private cloudRevision: string | null = null;
  private cloudPending = true;
  private cloudTimer?: ReturnType<typeof setTimeout>;
  private readonly cloudMetaKey = 'aulufa-dilema-cloud-v1';
  get recoveryLink(): string { return this.cloudRevision ? `${location.origin}/#dilema-do-rei/${this.cloudKey}` : ''; }
  private readonly onVisibility = () => { if (document.visibilityState === 'hidden') void this.saveCloud(); };
  private readonly onStorage = (event: StorageEvent) => { if (event.key === this.key) { this.storageBlocked = true; this.storageStatus = 'A campanha mudou em outra aba. Exporte suas alterações antes de recarregar esta página.'; this.changeDetector?.markForCheck(); } };
  constructor(private readonly changeDetector?: ChangeDetectorRef) {
    try { const saved = localStorage.getItem(this.key); if (saved) this.data = validateChronicle(JSON.parse(saved)); this.storageStatus = saved ? 'Campanha recuperada deste navegador' : 'Rascunho salvo automaticamente neste navegador'; }
    catch { this.storageBlocked = true; this.storageStatus = 'Não foi possível recuperar os dados locais. Exporte um arquivo para preservar seu trabalho.'; }
    this.editingId = this.data.games.some(g => g.id === this.data.draft.id) ? this.data.draft.id : '';
    window.addEventListener('storage', this.onStorage);
  }
  ngOnInit(): void { void this.connectCloud(); document.addEventListener('visibilitychange', this.onVisibility); }
  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorage);
    document.removeEventListener('visibilitychange', this.onVisibility);
    clearTimeout(this.cloudTimer); void this.saveCloud();
  }
  changed(): void {
    if (this.storageBlocked) return;
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); this.storageStatus = 'Salvo neste navegador às ' + new Date().toLocaleTimeString('pt-BR'); }
    catch { this.storageStatus = 'Não foi possível salvar no navegador. Baixe o arquivo JSON para preservar os dados.'; }
    this.cloudPending = true;
    this.persistCloudMeta();
    if (this.cloudReady && !this.cloudConflict) {
      this.cloudStatus = 'Alterações aguardando salvamento no site…';
      clearTimeout(this.cloudTimer);
      this.cloudTimer = setTimeout(() => void this.saveCloud(), 1000);
    }
  }
  private persistCloudMeta(): void {
    if (!this.cloudKey) return;
    try { localStorage.setItem(this.cloudMetaKey,JSON.stringify({key:this.cloudKey,etag:this.cloudRevision,pending:this.cloudPending})); } catch { /* A nuvem continua disponível mesmo sem armazenamento local. */ }
  }
  async connectCloud(reload = false): Promise<void> {
    if (this.cloudBusy) return;
    if (reload && !confirm('Carregar a versão salva no site? Uma cópia do estado atual será mantida neste navegador.')) return;
    this.cloudBusy = true; this.cloudReady = false;
    const before = JSON.stringify(this.data);
    try {
      let meta: {key?:string;etag?:string;pending?:boolean} = {};
      try { meta = JSON.parse(localStorage.getItem(this.cloudMetaKey) || '{}'); } catch { /* Inicia uma conexão nova. */ }
      const fromLink = globalThis.location?.hash.split('/')[1];
      const key = /^[a-f0-9]{64}$/.test(fromLink ?? '') ? fromLink! : meta.key;
      this.cloudKey = key && /^[a-f0-9]{64}$/.test(key) ? key : Array.from(crypto.getRandomValues(new Uint8Array(32)),b => b.toString(16).padStart(2,'0')).join('');
      const sameCampaign = meta.key === this.cloudKey;
      this.cloudRevision = sameCampaign ? meta.etag ?? null : null;
      this.cloudPending = sameCampaign ? meta.pending !== false : true;
      // Persist the recovery key before making a network request.
      if (sameCampaign || !meta.key) this.persistCloudMeta();
      const response = await fetch('/api/dilema',{headers:{Authorization:`Bearer ${this.cloudKey}`},cache:'no-store',signal:AbortSignal.timeout(20000)});
      if (response.status === 404) {
        if (this.cloudRevision || fromLink) throw new Error('Campanha não encontrada no site. Seus dados locais foram preservados.');
        this.cloudConflict = false; this.cloudReady = true; this.cloudPending = true;
      } else {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Não foi possível recuperar a campanha.');
        const remote = validateChronicle(body.data);
        const etag = response.headers.get('ETag');
        if (!etag) throw new Error('Resposta de armazenamento sem revisão.');
        if (!reload && sameCampaign && (this.cloudPending || before !== JSON.stringify(this.data))) {
          if (this.cloudRevision !== etag) { this.cloudConflict = true; throw new Error('Há alterações locais e uma versão diferente no site. Baixe um backup e use Carregar do site para escolher a versão salva.'); }
          // Offline edits are newer than the unchanged server version.
        } else {
          if (before !== JSON.stringify(remote)) { try { localStorage.setItem(this.key+'-backup',JSON.stringify(this.data)); } catch { throw new Error('Baixe um backup local antes de carregar a versão do site.'); } }
          this.data = remote; this.cloudPending = false; this.storageBlocked = false;
          this.editingId = this.data.games.some(g => g.id === this.data.draft.id) ? this.data.draft.id : '';
          try { localStorage.setItem(this.key,JSON.stringify(this.data)); } catch { /* O arquivo permanente continua preservado. */ }
        }
        this.cloudRevision = etag; this.cloudReady = true; this.cloudConflict = false;
        this.cloudStatus = 'Campanha recuperada do site · ' + new Date(body.savedAt).toLocaleString('pt-BR');
      }
      this.persistCloudMeta();
    } catch (error) { this.cloudStatus = error instanceof Error ? error.message : 'Sem conexão com o site. Os dados permanecem neste navegador.'; }
    finally { this.cloudBusy = false; this.changeDetector?.markForCheck(); }
    if (this.cloudReady && this.cloudPending) await this.saveCloud();
  }
  async saveCloud(): Promise<void> {
    if (!this.cloudReady || this.cloudBusy || this.cloudConflict || !this.cloudPending || this.storageBlocked) return;
    clearTimeout(this.cloudTimer); this.cloudBusy = true;
    try {
      const snapshot = JSON.stringify(validateChronicle(this.data));
      const response = await fetch('/api/dilema',{method:'PUT',headers:{Authorization:`Bearer ${this.cloudKey}`,'Content-Type':'application/json',...(this.cloudRevision ? {'If-Match':this.cloudRevision} : {'If-None-Match':'*'})},body:snapshot,keepalive:snapshot.length < 50000,signal:AbortSignal.timeout(20000)});
      const body = await response.json();
      if (response.status === 409) this.cloudConflict = true;
      if (!response.ok) throw new Error(body.error || 'Não foi possível salvar no site.');
      const etag = response.headers.get('ETag'); if (!etag) throw new Error('O site não confirmou a revisão salva.');
      this.cloudRevision = etag; this.cloudPending = snapshot !== JSON.stringify(this.data); this.persistCloudMeta();
      this.cloudStatus = 'Salvo permanentemente no site · ' + new Date(body.savedAt).toLocaleString('pt-BR');
      if (this.cloudPending) this.cloudTimer = setTimeout(() => void this.saveCloud(),1000);
    } catch (error) { this.cloudStatus = (error instanceof Error ? error.message : 'Falha ao salvar no site.') + ' A cópia local foi mantida.'; }
    finally { this.cloudBusy = false; this.changeDetector?.markForCheck(); }
  }
  async copyCampaignLink(): Promise<void> {
    if (!this.cloudRevision) { this.message = 'Salve a campanha no site antes de copiar o link.'; return; }
    const url = this.recoveryLink;
    try { await navigator.clipboard.writeText(url); this.message = 'Link da campanha copiado. Guarde nos favoritos para consultar em outro dispositivo. Quem tiver esse link poderá consultar e editar a campanha.'; }
    catch { this.message = 'Copie e guarde este link da campanha: ' + url; }
    finally { this.changeDetector?.markForCheck(); }
  }
  addHouse(): void { if (this.data.draft.houses.length < 5) { this.data.draft.houses.push(newHouse()); this.changed(); } }
  removeHouse(h: HouseScore): void {
    if (this.data.draft.houses.length <= 3) return;
    if ((h.house || total(h) || h.secret || h.open || h.coins || h.power) && !confirm('Remover esta casa da partida atual?')) return;
    this.data.draft.houses = this.data.draft.houses.filter(row => row.id !== h.id); this.changed();
  }
  saveGame(): void {
    try {
      validateChronicle(this.data);
      const draft = this.data.draft;
      if (!this.data.campaign.trim() || !draft.king.trim() || draft.houses.some(h => !h.house.trim() || [h.secret,h.open,h.coins,h.power].some(x => x === null))) throw new Error('Preencha o nome da campanha, o rei, todas as casas e os pontos. Use 0 quando não houver pontos.');
      if (new Set(draft.houses.map(h => h.house.trim().toLocaleLowerCase('pt-BR'))).size !== draft.houses.length) throw new Error('Use um nome diferente para cada casa.');
      const game = structuredClone(draft);
      const index = this.data.games.findIndex(g => g.id === this.editingId);
      if (index >= 0) this.data.games[index] = game; else this.data.games.push(game);
      this.data.draft = newReign(game.houses); this.editingId = ''; this.changed(); this.message = 'Partida registrada. A próxima ficha está pronta, com as mesmas casas.';
    } catch (error) { this.message = error instanceof Error ? error.message : 'Confira os campos.'; }
  }
  edit(game: Reign): void {
    if (!confirm('Abrir esta partida para editar? O rascunho atual será substituído.')) return;
    this.data.draft = structuredClone(game); this.editingId = game.id; this.changed(); window.scrollTo({top:0,behavior:'smooth'});
  }
  remove(game: Reign): void {
    if (!confirm(`Excluir o registro de ${game.king}? Baixe um backup se quiser preservá-lo.`)) return;
    this.data.games = this.data.games.filter(g => g.id !== game.id); if (this.editingId === game.id) this.editingId = ''; this.changed();
  }
  exportFile(): void {
    const blob = new Blob([JSON.stringify(this.data,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dilema-do-rei-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.message = 'Arquivo JSON preparado para download. Guarde-o e use Importar arquivo para continuar depois.';
  }
  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('O arquivo deve ter até 5 MB.');
      const imported = validateChronicle(JSON.parse(await file.text()));
      if (!confirm(`Importar “${imported.campaign}”, com ${imported.games.length} partidas? Isso substituirá a campanha e o rascunho deste navegador. Exporte um backup antes se necessário.`)) return;
      this.data = imported; this.editingId = ''; this.storageBlocked = false; this.changed(); this.message = 'Campanha importada com sucesso.';
    } catch (error) { this.message = error instanceof Error ? error.message : 'Não foi possível importar o arquivo.'; }
    finally { input.value = ''; this.changeDetector?.markForCheck(); }
  }
  dateLabel(date: string): string { return new Date(date+'T12:00:00').toLocaleDateString('pt-BR'); }
  winners(game: Reign): string { return game.houses.filter(h => rank(h,game.houses) === 1).map(h => h.house).join(' e '); }
}
