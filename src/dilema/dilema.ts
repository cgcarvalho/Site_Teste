import { Component, OnDestroy } from '@angular/core';
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
  private readonly onStorage = (event: StorageEvent) => { if (event.key === this.key) { this.storageBlocked = true; this.storageStatus = 'A campanha mudou em outra aba. Exporte suas alterações antes de recarregar esta página.'; } };
  constructor() {
    try { const saved = localStorage.getItem(this.key); if (saved) this.data = validateChronicle(JSON.parse(saved)); this.storageStatus = saved ? 'Campanha recuperada deste navegador' : 'Rascunho salvo automaticamente neste navegador'; }
    catch { this.storageBlocked = true; this.storageStatus = 'Não foi possível recuperar os dados locais. Exporte um arquivo para preservar seu trabalho.'; }
    this.editingId = this.data.games.some(g => g.id === this.data.draft.id) ? this.data.draft.id : '';
    window.addEventListener('storage', this.onStorage);
  }
  ngOnDestroy(): void { window.removeEventListener('storage', this.onStorage); }
  changed(): void {
    if (this.storageBlocked) return;
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); this.storageStatus = 'Salvo neste navegador às ' + new Date().toLocaleTimeString('pt-BR'); }
    catch { this.storageStatus = 'Não foi possível salvar no navegador. Baixe o arquivo JSON para preservar os dados.'; }
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
    finally { input.value = ''; }
  }
  dateLabel(date: string): string { return new Date(date+'T12:00:00').toLocaleDateString('pt-BR'); }
  winners(game: Reign): string { return game.houses.filter(h => rank(h,game.houses) === 1).map(h => h.house).join(' e '); }
}
