import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { importedCollection } from './collection';

export interface BoardGame {
  id: string;
  name: string;
  originalName: string;
  year: number | null;
  playersMin: number | null;
  playersMax: number | null;
  idealPlayers: string;
  timeMin: number | null;
  timeMax: number | null;
  age: number | null;
  complexity: number | null;
  designers: string;
  artists: string;
  publishers: string;
  edition: string;
  language: string;
  categories: string[];
  mechanics: string[];
  bggId: string;
  bggUrl: string;
  ludopediaUrl: string;
  boxLength: number | null;
  boxWidth: number | null;
  boxHeight: number | null;
  notes: string;
}

interface GameDraft {
  name: string; originalName: string; year: string | number | null; playersMin: string | number | null; playersMax: string | number | null;
  idealPlayers: string;
  timeMin: string | number | null; timeMax: string | number | null; age: string | number | null; complexity: string | number | null; designers: string;
  artists: string; publishers: string; edition: string; language: string; categories: string[];
  mechanics: string; bggId: string; bggUrl: string; ludopediaUrl: string;
  boxLength: string | number | null; boxWidth: string | number | null; boxHeight: string | number | null; notes: string;
}

interface ShelfDraft { id: string; width: number | null; depth: number | null; height: number | null; }
interface SizedShelf extends ShelfDraft { width: number; depth: number; height: number; }
interface ShelfBox { game: BoardGame; x: number; y: number; width: number; depth: number; rotated: boolean; }
interface ShelfLayout { shelf: SizedShelf; boxes: ShelfBox[]; usedArea: number; }
interface FreeRect { x: number; y: number; width: number; depth: number; }
interface PlacementChoice { shelfIndex: number; rectIndex: number; width: number; depth: number; rotated: boolean; score: number[]; }

const emptyDraft = (): GameDraft => ({
  name: '', originalName: '', year: '', playersMin: '', playersMax: '', idealPlayers: '', timeMin: '', timeMax: '',
  age: '', complexity: '', designers: '', artists: '', publishers: '', edition: '', language: '',
  categories: [], mechanics: '', bggId: '', bggUrl: '', ludopediaUrl: '', boxLength: '',
  boxWidth: '', boxHeight: '', notes: ''
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="app-shell">
      <aside class="sidebar" [class.sidebar-open]="menuOpen">
        <a class="brand" href="#inicio" (click)="selectItem('pendengas-da-vida')" aria-label="Controle da Vida Aulufa, início">
          <span class="brand-mark" aria-hidden="true">a</span>
          <span class="brand-name">controle da vida <strong>Aulufa</strong></span>
        </a>
        <div class="nav-label">MENU</div>
        <nav aria-label="Navegação principal">
          @for (item of navItems; track item.id) {
            <a class="nav-link" [class.active]="activeItem === item.id" [attr.aria-current]="activeItem === item.id ? 'page' : null"
              [href]="'#' + item.id" (click)="selectItem(item.id)">
              @if (item.id === 'cadastro-jogos') {
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.75h10a2.25 2.25 0 0 1 2.25 2.25v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"/><path d="M8.5 9.5h7M8.5 13h3M16.5 15.5h.01"/></svg>
              } @else if (item.id === 'organizar-estante') {
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.75h16v14.5H4zM4 10h16M4 15.25h16M8 4.75V10m8-5.25V10m-5 0v5.25m5 0v4"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.75h10.25M9 12h10.25M9 17.25h10.25M4.75 6.75h.5M4.75 12h.5M4.75 17.25h.5"/></svg>
              }
              <span>{{ item.label }}</span><span class="nav-arrow" aria-hidden="true">›</span>
            </a>
          }
        </nav>
        <div class="sidebar-note"><span class="note-spark" aria-hidden="true">✳</span><p>Um passo de cada vez.<br><strong>A vida fica mais leve.</strong></p></div>
        <div class="sidebar-footer"><span class="online-dot"></span> Feito com carinho, a dois</div>
      </aside>
      @if (menuOpen) { <button class="backdrop" aria-label="Fechar menu" (click)="closeMenu()"></button> }

      <main class="main-content" id="inicio">
        <header class="topbar">
          <button class="menu-toggle" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen" aria-label="Abrir menu"><span></span><span></span><span></span></button>
          <div class="breadcrumb"><span>Nosso espaço</span><span class="crumb-divider">/</span><strong>{{ activeLabel }}</strong></div>
          <div class="topbar-date"><span class="date-dot"></span> Organizando a vida juntos</div>
        </header>

        @if (activeItem === 'cadastro-jogos') {
          <div class="games-page page-container" id="cadastro-jogos">
            <div class="games-heading">
              <div><div class="eyebrow"><span class="eyebrow-line"></span> NOSSA COLEÇÃO</div><h1>Cadastro de jogos <span class="wave" aria-hidden="true">✳</span></h1>
                <p class="intro">Um catálogo dos jogos que fazem parte das nossas histórias à mesa.</p></div>
              <button class="primary-button" (click)="openNewGame()"><span aria-hidden="true">＋</span> Cadastrar jogo</button>
            </div>

            <div class="collection-strip">
              <div class="collection-stat"><span class="stat-number">{{ games.length }}</span><span class="stat-caption">{{ games.length === 1 ? 'jogo cadastrado' : 'jogos cadastrados' }}</span></div>
              <div class="collection-divider"></div>
              <div class="collection-hint"><span class="hint-spark">✳</span><span>Uma coleção construída<br><strong>jogada por jogada.</strong></span></div>
              <span class="collection-decor decor-die" aria-hidden="true">⚄</span><span class="collection-decor decor-star" aria-hidden="true">✳</span>
            </div>

            <div class="catalog-toolbar">
              <div class="catalog-title"><div class="section-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.75h10a2.25 2.25 0 0 1 2.25 2.25v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"/><path d="M8.5 9.5h7M8.5 13h3M16.5 15.5h.01"/></svg></div><div><div class="section-kicker">BIBLIOTECA AULUFA</div><h2>Os nossos jogos</h2></div></div>
              <span class="result-count">{{ filteredGames.length }} {{ filteredGames.length === 1 ? 'resultado' : 'resultados' }}</span>
            </div>

            <div class="filter-panel">
              <label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m15.5 15.5 4 4"/></svg><input type="search" placeholder="Buscar por jogo, designer ou editora" [(ngModel)]="searchTerm" aria-label="Buscar jogos"></label>
              <label class="filter-field"><span>JOGADORES</span><select [(ngModel)]="playerFilter" aria-label="Filtrar por número de jogadores"><option value="">Qualquer número</option>@for (n of playerOptions; track n) { <option [value]="n">{{ n }} {{ n === 1 ? 'jogador' : 'jogadores' }}</option> }</select></label>
              <label class="filter-field"><span>IDEAL PARA</span><select [(ngModel)]="idealPlayersFilter" aria-label="Filtrar por número ideal de jogadores"><option value="">Qualquer número ideal</option>@for (n of idealPlayerOptions; track n) { <option [value]="n">{{ n }} {{ n === 1 ? 'jogador' : 'jogadores' }}</option> }</select></label>
              <label class="filter-field category-filter"><span>CATEGORIA</span><select [(ngModel)]="categoryFilter" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option>@for (category of categories; track category) { <option [value]="category">{{ category }}</option> }</select></label>
              @if (searchTerm || playerFilter || idealPlayersFilter || categoryFilter) { <button class="clear-filters" (click)="clearFilters()">Limpar filtros</button> }
            </div>

            @if (filteredGames.length > 0) {
              <div class="games-list">
                @for (game of filteredGames; track game.id) {
                  <article class="game-card">
                    <div class="game-cover" aria-hidden="true"><span>{{ initials(game.name) }}</span><i>✳</i></div>
                    <div class="game-main">
                      <div class="game-title-row"><div><h3>{{ game.name }}</h3>@if (game.originalName) { <span class="original-title">{{ game.originalName }}</span> }</div><div class="game-actions"><button class="edit-button" (click)="viewGame(game)" [attr.aria-label]="'Visualizar dados de ' + game.name" title="Visualizar dados"><span>Ver</span></button><button class="edit-button" (click)="editGame(game)" [attr.aria-label]="'Editar ' + game.name" title="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.5-1 10.2-10.2a2.12 2.12 0 0 0-3-3L5.5 16 4 20Z"/></svg><span>Editar</span></button><button class="delete-button" (click)="deleteGame(game)" [attr.aria-label]="'Excluir ' + game.name" title="Excluir">×</button></div></div>
                      <div class="game-publisher">{{ game.publishers || 'Editora não informada' }}@if (game.year) { <span>·</span> {{ game.year }} }</div>
                      <div class="game-tags">@for (tag of game.categories.slice(0, 3); track tag) { <span>{{ tag }}</span> }</div>
                      <div class="game-facts">
                        <span><b>♟</b> {{ playerRange(game) }}</span><span><b>◷</b> {{ timeRange(game) }}</span><span><b>↗</b> {{ game.age ? game.age + '+' : 'Livre' }}</span>
                        @if (game.complexity) { <span><b>◉</b> Peso {{ game.complexity }}/5</span> }
                      </div>
                      @if (game.boxLength || game.boxWidth || game.boxHeight) { <div class="box-size"><span class="box-cube" aria-hidden="true">▧</span> Caixa {{ dimension(game.boxLength) }} × {{ dimension(game.boxWidth) }} × {{ dimension(game.boxHeight) }} cm <small>(C × L × A)</small></div> }
                      @if (game.mechanics.length > 0) { <div class="game-mechanics"><strong>Mecânicas</strong><span>{{ game.mechanics.join(' · ') }}</span></div> }
                      <div class="game-links">@if (game.bggUrl) { <a [href]="game.bggUrl" target="_blank" rel="noreferrer">BoardGameGeek ↗</a> } @if (game.ludopediaUrl) { <a [href]="game.ludopediaUrl" target="_blank" rel="noreferrer">Ludopedia ↗</a> }</div>
                    </div>
                  </article>
                }
              </div>
            } @else if (games.length > 0) {
              <div class="empty-state filtered-empty"><div class="empty-illustration">⌕</div><h3>Nenhum jogo encontrado</h3><p>Tente mudar os filtros ou buscar por outro termo.</p><button class="text-button" (click)="clearFilters()">Limpar filtros</button></div>
            } @else {
              <div class="empty-state"><div class="empty-illustration">⚄</div><div class="empty-kicker">A MESA ESTÁ PRONTA</div><h3>Nosso primeiro jogo começa aqui</h3><p>Cadastrem os jogos da coleção para encontrar tudo num só lugar: jogadores, duração, editora e até o tamanho da caixa.</p><button class="primary-button empty-action" (click)="openNewGame()"><span aria-hidden="true">＋</span> Cadastrar primeiro jogo</button></div>
            }
            <div class="data-note"><span class="data-note-icon">◷</span> Coleção importada do BoardGameGeek: 304 jogos e expansões. Edições e novos cadastros ficam salvos neste navegador.</div>
            <footer class="page-footer"><span>Controle da Vida Aulufa</span><span>Um projeto nosso <span class="heart">♥</span></span></footer>
          </div>
        } @else if (activeItem === 'organizar-estante') {
          <div class="games-page page-container" id="organizar-estante">
            <div class="games-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> NOSSA COLEÇÃO</div><h1>Organizar estante <span class="wave" aria-hidden="true">✳</span></h1><p class="intro">Informe as medidas úteis de cada prateleira e encontre uma disposição compacta para as caixas.</p></div></div>
            <section class="shelf-settings">
              <div class="shelf-section-heading"><div><div class="section-kicker">MEDIDAS INTERNAS · CM</div><h2>Suas prateleiras</h2></div><button class="secondary-button" type="button" (click)="addShelf()">＋ Adicionar prateleira</button></div>
              @for (shelf of shelves; track shelf.id; let i = $index) {
                <div class="shelf-input-row">
                  <strong>Prateleira {{ i + 1 }}</strong>
                  <label class="form-field"><span>Largura</span><input type="number" min="1" step="0.1" [(ngModel)]="shelf.width" (ngModelChange)="shelfSettingsChanged()" placeholder="80"></label>
                  <label class="form-field"><span>Profundidade</span><input type="number" min="1" step="0.1" [(ngModel)]="shelf.depth" (ngModelChange)="shelfSettingsChanged()" placeholder="30"></label>
                  <label class="form-field"><span>Altura livre</span><input type="number" min="1" step="0.1" [(ngModel)]="shelf.height" (ngModelChange)="shelfSettingsChanged()" placeholder="35"></label>
                  <button class="delete-button" type="button" [disabled]="shelves.length === 1" (click)="removeShelf(shelf.id)" [attr.aria-label]="'Remover prateleira ' + (i + 1)">×</button>
                </div>
              }
              <div class="shelf-controls"><span>{{ packableGames.length }} caixas com dimensões completas · {{ gamesWithoutBoxDimensions.length }} sem medidas</span><button class="primary-button" type="button" (click)="calculateShelfLayout()">Organizar caixas</button></div>
            </section>
            @if (layoutMessage) { <div class="shelf-message" role="status">{{ layoutMessage }}</div> }
            @if (shelfLayouts.length) {
              <div class="shelf-results"><div class="catalog-toolbar"><div class="catalog-title"><div><div class="section-kicker">DISPOSIÇÃO SUGERIDA</div><h2>{{ placedBoxCount }} de {{ packableGames.length }} caixas acomodadas</h2></div></div><span class="result-count">{{ shelfLayouts.length }} prateleiras usadas</span></div>
                @for (layout of shelfLayouts; track layout.shelf.id; let i = $index) {
                  <section class="shelf-result-card"><div class="shelf-result-heading"><h3>Prateleira {{ shelfNumber(layout.shelf.id) }}</h3><span>{{ layout.shelf.width }} × {{ layout.shelf.depth }} × {{ layout.shelf.height }} cm · {{ shelfUtilization(layout) }}% ocupado</span></div>
                    <div class="shelf-map" [style.aspect-ratio]="layout.shelf.width + ' / ' + layout.shelf.depth" role="img" [attr.aria-label]="'Mapa da prateleira ' + shelfNumber(layout.shelf.id)">
                      @for (box of layout.boxes; track box.game.id) {
                        <div class="shelf-box" [style.left.%]="box.x / layout.shelf.width * 100" [style.top.%]="box.y / layout.shelf.depth * 100" [style.width.%]="box.width / layout.shelf.width * 100" [style.height.%]="box.depth / layout.shelf.depth * 100" [title]="box.game.name + ' · ' + box.width + ' × ' + box.depth + ' cm'">
                          @if (box.width / layout.shelf.width > 0.1 && box.depth / layout.shelf.depth > 0.2) { <span>{{ box.game.name }}</span> }
                        </div>
                      }
                    </div>
                    <div class="shelf-box-list">@for (box of layout.boxes; track box.game.id) { <div><strong>{{ box.game.name }}</strong><span>{{ box.width }} × {{ box.depth }} × {{ box.game.boxHeight }} cm{{ box.rotated ? ' · girada na base' : '' }}</span></div> }</div>
                  </section>
                }
              </div>
              @if (unplacedGames.length) { <section class="unplaced-card"><h3>Caixas que não couberam ({{ unplacedGames.length }})</h3><p>Revise as medidas das prateleiras ou as dimensões cadastradas desses jogos.</p><div class="unplaced-list">@for (game of unplacedGames; track game.id) { <span>{{ game.name }}</span> }</div></section> }
            }
            @if (gamesWithoutBoxDimensions.length) { <p class="shelf-footnote">Jogos sem comprimento, largura e altura cadastrados não entram no cálculo. Complete as dimensões no Cadastro de Jogos para incluí-los.</p> }
            <footer class="page-footer"><span>Controle da Vida Aulufa</span><span>Um projeto nosso <span class="heart">♥</span></span></footer>
          </div>
        } @else {
          <div class="page-container">
            <div class="welcome-row"><div><div class="eyebrow"><span class="eyebrow-line"></span> NOSSO CANTINHO</div><h1>Oi, vocês <span class="wave" aria-hidden="true">✳</span></h1><p class="intro">Um espaço para cuidar das pequenas coisas e abrir espaço para as grandes.</p></div><div class="date-card"><span class="date-icon">☀</span><span>Feito para a vida<br><strong>real, do jeitinho que ela é.</strong></span></div></div>
            <section class="section-heading" id="pendengas-da-vida"><div class="section-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5h11M8 12h11M8 18.5h11M4.5 5.5h.01M4.5 12h.01M4.5 18.5h.01"/></svg></div><div><div class="section-kicker">NOSSO DIA A DIA</div><h2>Pendengas da vida</h2></div></section>
            <section class="welcome-card" aria-label="Pendengas da vida"><div class="card-copy"><span class="card-label"><span class="card-label-dot"></span> UM COMEÇO LEVE</span><h3>Toda grande mudança<br>começa com uma coisinha.</h3><p>Este cantinho vai ajudar a gente a lembrar, organizar e resolver as pendências da vida — juntos e sem pressa.</p></div><div class="card-art" aria-hidden="true"><div class="art-sun"></div><div class="art-plant plant-one"><i></i><i></i><i></i><b></b></div><div class="art-plant plant-two"><i></i><i></i><b></b></div><div class="art-pot"></div><div class="art-note"><span>✓</span><span></span><span></span></div></div><div class="card-bottom"><span><span class="tiny-spark">✳</span> Feito para nós dois</span><span class="card-bottom-right">SEM PRESSA, SEM PERFEIÇÃO <span>↗</span></span></div></section>
            <footer class="page-footer"><span>Controle da Vida Aulufa</span><span>Um projeto nosso <span class="heart">♥</span></span></footer>
          </div>
        }
      </main>

      @if (dialogOpen) {
        <div class="modal-backdrop" (click)="closeDialog()">
          <section class="game-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" (click)="$event.stopPropagation()">
            <header class="dialog-header"><div><div class="eyebrow"><span class="eyebrow-line"></span> A NOSSA COLEÇÃO</div><h2 id="dialog-title">{{ editingId ? 'Editar jogo' : 'Cadastrar jogo' }}</h2><p>Os campos com * são essenciais. O restante pode ser preenchido depois.</p></div><button class="dialog-close" type="button" aria-label="Fechar" (click)="closeDialog()">×</button></header>
            <form class="game-form">
              <div class="form-section-label">IDENTIFICAÇÃO</div>
              <div class="form-grid"><label class="form-field span-two"><span>Nome do jogo *</span><input name="name" [(ngModel)]="draft.name" required maxlength="120" placeholder="Ex.: Catan"></label><label class="form-field"><span>Nome original</span><input name="originalName" [(ngModel)]="draft.originalName" placeholder="Ex.: The Settlers of Catan"></label><label class="form-field"><span>Ano de publicação</span><input name="year" [(ngModel)]="draft.year" type="number" min="1900" max="2100" placeholder="1995"></label><label class="form-field"><span>Edição</span><input name="edition" [(ngModel)]="draft.edition" placeholder="Ex.: edição brasileira"></label><label class="form-field"><span>Idioma</span><input name="language" [(ngModel)]="draft.language" placeholder="Português"></label></div>
              <div class="form-section-label">DADOS TÉCNICOS</div>
              <div class="form-grid"><label class="form-field"><span>Jogadores · mínimo</span><input name="playersMin" [(ngModel)]="draft.playersMin" type="number" min="1" max="100" placeholder="2"></label><label class="form-field"><span>Jogadores · máximo</span><input name="playersMax" [(ngModel)]="draft.playersMax" type="number" min="1" max="100" placeholder="4"></label><label class="form-field"><span>Número ideal de jogadores</span><input name="idealPlayers" [(ngModel)]="draft.idealPlayers" placeholder="Ex.: 2, 3 (ou todos)"></label><label class="form-field"><span>Tempo mínimo (min)</span><input name="timeMin" [(ngModel)]="draft.timeMin" type="number" min="1" placeholder="60"></label><label class="form-field"><span>Tempo máximo (min)</span><input name="timeMax" [(ngModel)]="draft.timeMax" type="number" min="1" placeholder="120"></label><label class="form-field"><span>Idade recomendada (anos)</span><input name="age" [(ngModel)]="draft.age" type="number" min="0" max="99" placeholder="10"></label><label class="form-field"><span>Complexidade BGG (1 a 5)</span><input name="complexity" [(ngModel)]="draft.complexity" type="number" min="1" max="5" step="0.01" placeholder="2.28"></label><label class="form-field"><span>Designer</span><input name="designers" [(ngModel)]="draft.designers" placeholder="Separe por vírgula"></label><label class="form-field"><span>Artista(s)</span><input name="artists" [(ngModel)]="draft.artists" placeholder="Separe por vírgula"></label><label class="form-field span-two"><span>Editora(s)</span><input name="publishers" [(ngModel)]="draft.publishers" placeholder="Separe por vírgula"></label><div class="form-field span-two"><span>Categorias</span><div class="category-options">@for (category of categoryOptions; track category) { <label class="category-option"><input type="checkbox" [checked]="draft.categories.includes(category)" (change)="toggleDraftCategory(category, $event)"><span>{{ category }}</span></label> }</div><div class="category-add"><input name="newCategory" [(ngModel)]="newCategory" placeholder="Adicionar outra categoria" (keydown.enter)="$event.preventDefault(); addDraftCategory()"><button type="button" class="secondary-button" (click)="addDraftCategory()">Adicionar</button></div></div><label class="form-field span-two"><span>Lista de mecanismos</span><input name="mechanics" [(ngModel)]="draft.mechanics" placeholder="Negociação, alocação de dados"></label></div>
              <div class="form-section-label">DIMENSÕES DA CAIXA <small>em centímetros</small></div>
              <div class="form-grid dimension-grid"><label class="form-field"><span>Comprimento</span><input name="boxLength" [(ngModel)]="draft.boxLength" type="number" min="0" step="0.1" placeholder="30"></label><label class="form-field"><span>Largura</span><input name="boxWidth" [(ngModel)]="draft.boxWidth" type="number" min="0" step="0.1" placeholder="30"></label><label class="form-field"><span>Altura</span><input name="boxHeight" [(ngModel)]="draft.boxHeight" type="number" min="0" step="0.1" placeholder="7"></label></div>
              <div class="form-section-label">REFERÊNCIAS E OBSERVAÇÕES</div>
              <div class="form-grid"><label class="form-field"><span>ID no BoardGameGeek</span><input name="bggId" [(ngModel)]="draft.bggId" placeholder="13"></label><label class="form-field"><span>Link no BoardGameGeek</span><input name="bggUrl" [(ngModel)]="draft.bggUrl" type="url" placeholder="https://boardgamegeek.com/boardgame/13"></label><label class="form-field span-two"><span>Link na Ludopedia</span><input name="ludopediaUrl" [(ngModel)]="draft.ludopediaUrl" type="url" placeholder="https://ludopedia.com.br/jogo/..."></label><label class="form-field span-two"><span>Anotações</span><textarea name="notes" [(ngModel)]="draft.notes" rows="3" placeholder="Edição da nossa cópia, observações…"></textarea></label></div>
              <div class="dialog-actions"><button class="secondary-button" type="button" (click)="closeDialog()">Cancelar</button><button class="primary-button" type="button" (click)="saveGame()" [disabled]="!draft.name.trim()">{{ editingId ? 'Salvar alterações' : 'Salvar jogo' }}</button></div>
            </form>
          </section>
        </div>
      }

      @if (detailGame; as game) {
        <div class="modal-backdrop" (click)="closeDetails()">
          <section class="game-dialog details-dialog" role="dialog" aria-modal="true" aria-labelledby="details-title" (click)="$event.stopPropagation()">
            <header class="dialog-header"><div><div class="eyebrow"><span class="eyebrow-line"></span> FICHA DO JOGO</div><h2 id="details-title">{{ game.name }}</h2>@if (game.originalName) { <p>{{ game.originalName }}</p> }</div><button class="dialog-close" type="button" aria-label="Fechar" (click)="closeDetails()">×</button></header>
            <div class="game-details">
              <section class="detail-section"><h3>Dados técnicos</h3><div class="detail-grid"><div><span>Jogadores</span><strong>{{ playerRange(game) }}</strong></div><div><span>Número ideal</span><strong>{{ game.idealPlayers || 'Não informado' }}</strong></div><div><span>Duração</span><strong>{{ timeRange(game) }}</strong></div><div><span>Idade mínima</span><strong>{{ game.age === null ? 'Não informada' : game.age + '+' }}</strong></div><div><span>Ano</span><strong>{{ game.year || 'Não informado' }}</strong></div><div><span>Complexidade BGG</span><strong>{{ game.complexity ? game.complexity + '/5' : 'Não informada' }}</strong></div></div></section>
              <section class="detail-section"><h3>Créditos e edição</h3><div class="detail-grid"><div><span>Designer</span><strong>{{ game.designers || 'Não informado' }}</strong></div><div><span>Artista(s)</span><strong>{{ game.artists || 'Não informado' }}</strong></div><div><span>Editora(s)</span><strong>{{ game.publishers || 'Não informada' }}</strong></div><div><span>Edição</span><strong>{{ game.edition || 'Não informada' }}</strong></div><div><span>Idioma</span><strong>{{ game.language || 'Não informado' }}</strong></div><div><span>Categoria</span><strong>{{ game.categories.join(', ') || 'Não informada' }}</strong></div></div></section>
              <section class="detail-section"><h3>Lista de mecanismos</h3>@if (game.mechanics.length) { <div class="detail-chips">@for (mechanic of game.mechanics; track mechanic) { <span>{{ mechanic }}</span> }</div> } @else { <p class="detail-empty">Nenhum mecanismo informado.</p> }</section>
              <section class="detail-section"><h3>Dimensões da caixa</h3><p>{{ dimension(game.boxLength) }} × {{ dimension(game.boxWidth) }} × {{ dimension(game.boxHeight) }} cm <small>(comprimento × largura × altura)</small></p></section>
              @if (game.notes) { <section class="detail-section"><h3>Anotações</h3><p>{{ game.notes }}</p></section> }
              <section class="detail-section"><h3>Referências</h3><div class="detail-grid"><div><span>ID BoardGameGeek</span><strong>{{ game.bggId || 'Não informado' }}</strong></div></div><div class="game-links">@if (game.bggUrl) { <a [href]="game.bggUrl" target="_blank" rel="noreferrer">BoardGameGeek ↗</a> } @if (game.ludopediaUrl) { <a [href]="game.ludopediaUrl" target="_blank" rel="noreferrer">Ludopedia ↗</a> }</div></section>
              <div class="dialog-actions"><button class="secondary-button" type="button" (click)="closeDetails()">Fechar</button><button class="primary-button" type="button" (click)="closeDetails(); editGame(game)">Editar jogo</button></div>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: []
})
class AppComponent {
  private readonly storageKey = 'aulufa-boardgames-v1';
  private readonly deletedStorageKey = 'aulufa-boardgames-deleted-v1';
  private readonly shelfStorageKey = 'aulufa-shelves-v1';
  navItems = [{ id: 'pendengas-da-vida', label: 'Pendengas da vida' }, { id: 'cadastro-jogos', label: 'Cadastro de Jogos' }, { id: 'organizar-estante', label: 'Organizar estante' }];
  activeItem = 'pendengas-da-vida';
  menuOpen = false;
  dialogOpen = false;
  detailGame: BoardGame | null = null;
  editingId = '';
  draft: GameDraft = emptyDraft();
  newCategory = '';
  games: BoardGame[] = this.loadGames();
  shelves: ShelfDraft[] = this.loadShelves();
  shelfLayouts: ShelfLayout[] = [];
  unplacedGames: BoardGame[] = [];
  layoutMessage = '';
  searchTerm = '';
  playerFilter = '';
  idealPlayersFilter = '';
  categoryFilter = '';
  playerOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  get activeLabel(): string { return this.navItems.find((item) => item.id === this.activeItem)?.label ?? 'Pendengas da vida'; }
  get packableGames(): BoardGame[] { return this.games.filter((game) => this.validDimension(game.boxLength) && this.validDimension(game.boxWidth) && this.validDimension(game.boxHeight)); }
  get gamesWithoutBoxDimensions(): BoardGame[] { return this.games.filter((game) => !this.validDimension(game.boxLength) || !this.validDimension(game.boxWidth) || !this.validDimension(game.boxHeight)); }
  get placedBoxCount(): number { return this.shelfLayouts.reduce((sum, layout) => sum + layout.boxes.length, 0); }
  get categories(): string[] { return [...new Set(this.games.flatMap((game) => game.categories))].sort((a, b) => a.localeCompare(b, 'pt-BR')); }
  get categoryOptions(): string[] { return [...new Set([...this.categories, ...this.draft.categories])].sort((a, b) => a.localeCompare(b, 'pt-BR')); }
  get idealPlayerOptions(): number[] {
    return [...new Set(this.games.flatMap((game) => (game.idealPlayers.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0)))].sort((a, b) => a - b);
  }
  get filteredGames(): BoardGame[] {
    const term = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    const players = Number(this.playerFilter);
    const idealPlayers = Number(this.idealPlayersFilter);
    return this.games.filter((game) => {
      const haystack = [game.name, game.originalName, game.designers, game.publishers, ...game.categories, ...game.mechanics].join(' ').toLocaleLowerCase('pt-BR');
      const idealCounts = (game.idealPlayers.match(/\d+/g) ?? []).map(Number);
      return (!term || haystack.includes(term)) && (!players || ((game.playersMin ?? 1) <= players && (game.playersMax ?? 99) >= players)) && (!idealPlayers || idealCounts.includes(idealPlayers)) && (!this.categoryFilter || game.categories.includes(this.categoryFilter));
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  constructor() {
    const section = globalThis.location?.hash.slice(1);
    if (this.navItems.some((item) => item.id === section)) this.activeItem = section!;
  }
  selectItem(id: string): void { this.activeItem = id; this.closeMenu(); }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  addShelf(): void { this.shelves = [...this.shelves, this.newShelf()]; this.shelfSettingsChanged(); }
  removeShelf(id: string): void { if (this.shelves.length > 1) { this.shelves = this.shelves.filter((shelf) => shelf.id !== id); this.shelfSettingsChanged(); } }
  shelfSettingsChanged(): void { this.shelfLayouts = []; this.unplacedGames = []; this.layoutMessage = ''; try { globalThis.localStorage?.setItem(this.shelfStorageKey, JSON.stringify(this.shelves)); } catch { /* Medidas preservadas nesta sessão. */ } }
  shelfNumber(id: string): number { return this.shelves.findIndex((shelf) => shelf.id === id) + 1; }
  shelfUtilization(layout: ShelfLayout): number { return Math.round(layout.usedArea / ((layout.shelf.width ?? 0) * (layout.shelf.depth ?? 0)) * 100); }
  calculateShelfLayout(): void {
    const validShelves = this.shelves.filter((s): s is SizedShelf => this.validDimension(s.width) && this.validDimension(s.depth) && this.validDimension(s.height));
    if (!validShelves.length) { this.layoutMessage = 'Preencha largura, profundidade e altura livre de pelo menos uma prateleira.'; this.shelfLayouts = []; return; }
    if (!this.packableGames.length) { this.layoutMessage = 'Nenhum jogo tem as três dimensões da caixa cadastradas.'; this.shelfLayouts = []; return; }
    const orders = [
      [...this.packableGames].sort((a, b) => this.boxArea(b) - this.boxArea(a)),
      [...this.packableGames].sort((a, b) => this.boxSide(b) - this.boxSide(a) || this.boxArea(b) - this.boxArea(a)),
      [...this.packableGames].sort((a, b) => (b.boxHeight ?? 0) - (a.boxHeight ?? 0) || this.boxArea(b) - this.boxArea(a))
    ];
    let best: ShelfLayout[] = []; let bestCount = -1; let bestArea = -1;
    for (const order of orders) {
      const layouts = validShelves.map((shelf) => ({ shelf, boxes: [] as ShelfBox[], usedArea: 0 }));
      const freeRects: FreeRect[][] = validShelves.map((shelf) => [{ x: 0, y: 0, width: shelf.width, depth: shelf.depth }]);
      for (const game of order) {
        let choice: PlacementChoice | null = null;
        layouts.forEach((layout, shelfIndex) => {
          if ((game.boxHeight ?? Infinity) > layout.shelf.height!) return;
          freeRects[shelfIndex].forEach((rect, rectIndex) => {
            for (const rotated of [false, true]) {
              const width = rotated ? game.boxWidth! : game.boxLength!; const depth = rotated ? game.boxLength! : game.boxWidth!;
              if (width > rect.width || depth > rect.depth) continue;
              const shortFit = Math.min(rect.width - width, rect.depth - depth); const longFit = Math.max(rect.width - width, rect.depth - depth);
              const score = [shortFit, longFit, rect.width * rect.depth - width * depth, shelfIndex];
              if (!choice || this.scoreBefore(score, choice.score)) choice = { shelfIndex, rectIndex, width, depth, rotated, score };
            }
          });
        });
        if (!choice) continue;
        const selected = choice as unknown as PlacementChoice | null;
        if (!selected) continue;
        const rect = freeRects[selected.shelfIndex][selected.rectIndex];
        layouts[selected.shelfIndex].boxes.push({ game, x: rect.x, y: rect.y, width: selected.width, depth: selected.depth, rotated: selected.rotated });
        layouts[selected.shelfIndex].usedArea += this.boxArea(game);
        freeRects[selected.shelfIndex] = this.splitFreeRects(freeRects[selected.shelfIndex], { x: rect.x, y: rect.y, width: selected.width, depth: selected.depth });
      }
      const used = layouts.filter((layout) => layout.boxes.length);
      const count = used.reduce((sum, layout) => sum + layout.boxes.length, 0); const area = used.reduce((sum, layout) => sum + layout.usedArea, 0);
      if (count > bestCount || (count === bestCount && area > bestArea)) { best = used; bestCount = count; bestArea = area; }
    }
    this.shelfLayouts = best;
    const placed = new Set(best.flatMap((layout) => layout.boxes.map((box) => box.game.id)));
    this.unplacedGames = this.packableGames.filter((game) => !placed.has(game.id));
    this.layoutMessage = bestCount === 0 ? 'Nenhuma caixa coube. Confira as dimensões cadastradas e as medidas internas.' : '';
  }
  openNewGame(): void { this.editingId = ''; this.draft = emptyDraft(); this.newCategory = ''; this.dialogOpen = true; }
  closeDialog(): void { this.dialogOpen = false; }
  viewGame(game: BoardGame): void { this.detailGame = game; }
  closeDetails(): void { this.detailGame = null; }
  clearFilters(): void { this.searchTerm = ''; this.playerFilter = ''; this.idealPlayersFilter = ''; this.categoryFilter = ''; }
  initials(name: string): string { return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('pt-BR'); }
  playerRange(game: BoardGame): string { return game.playersMin && game.playersMax ? `${game.playersMin}–${game.playersMax} jogadores` : game.playersMin ? `${game.playersMin}+ jogadores` : 'Jogadores não informados'; }
  timeRange(game: BoardGame): string { return game.timeMin && game.timeMax ? `${game.timeMin}–${game.timeMax} min` : game.timeMin ? `${game.timeMin} min` : 'Duração não informada'; }
  dimension(value: number | null): string { return value === null ? '—' : String(value).replace('.', ','); }
  deleteGame(game: BoardGame): void {
    if (!globalThis.confirm(`Excluir “${game.name}” da coleção?`)) return;
    this.games = this.games.filter((entry) => entry.id !== game.id);
    try {
      const deleted = JSON.parse(globalThis.localStorage?.getItem(this.deletedStorageKey) || '[]') as string[];
      if (!deleted.includes(game.id)) deleted.push(game.id);
      globalThis.localStorage?.setItem(this.deletedStorageKey, JSON.stringify(deleted));
    } catch { /* A lista continua atualizada nesta sessão. */ }
    this.persistGames();
    if (this.detailGame?.id === game.id) this.closeDetails();
  }

  toggleDraftCategory(category: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.draft.categories = checked ? [...new Set([...this.draft.categories, category])] : this.draft.categories.filter((item) => item !== category);
  }
  addDraftCategory(): void {
    const category = this.newCategory.trim();
    if (!category) return;
    if (!this.draft.categories.some((item) => item.toLocaleLowerCase('pt-BR') === category.toLocaleLowerCase('pt-BR'))) {
      this.draft.categories = [...this.draft.categories, category];
    }
    this.newCategory = '';
  }

  private newShelf(): ShelfDraft { return { id: `${Date.now()}-${Math.random()}`, width: null, depth: null, height: null }; }
  private validDimension(value: number | null): value is number { return value !== null && Number.isFinite(value) && value > 0; }
  private boxArea(game: BoardGame): number { return (game.boxLength ?? 0) * (game.boxWidth ?? 0); }
  private boxSide(game: BoardGame): number { return Math.max(game.boxLength ?? 0, game.boxWidth ?? 0); }
  private scoreBefore(left: number[], right: number[]): boolean {
    for (let i = 0; i < left.length; i++) { if (left[i] !== right[i]) return left[i] < right[i]; }
    return false;
  }
  private splitFreeRects(rects: FreeRect[], placed: FreeRect): FreeRect[] {
    const split: FreeRect[] = [];
    for (const rect of rects) {
      const intersects = placed.x < rect.x + rect.width && placed.x + placed.width > rect.x && placed.y < rect.y + rect.depth && placed.y + placed.depth > rect.y;
      if (!intersects) { split.push(rect); continue; }
      if (placed.x > rect.x) split.push({ x: rect.x, y: rect.y, width: placed.x - rect.x, depth: rect.depth });
      if (placed.x + placed.width < rect.x + rect.width) split.push({ x: placed.x + placed.width, y: rect.y, width: rect.x + rect.width - placed.x - placed.width, depth: rect.depth });
      if (placed.y > rect.y) split.push({ x: rect.x, y: rect.y, width: rect.width, depth: placed.y - rect.y });
      if (placed.y + placed.depth < rect.y + rect.depth) split.push({ x: rect.x, y: placed.y + placed.depth, width: rect.width, depth: rect.y + rect.depth - placed.y - placed.depth });
    }
    return split.filter((rect, i) => rect.width > 0 && rect.depth > 0 && !split.some((other, j) => i !== j && other.x <= rect.x && other.y <= rect.y && other.x + other.width >= rect.x + rect.width && other.y + other.depth >= rect.y + rect.depth));
  }
  private loadShelves(): ShelfDraft[] {
    try {
      const value = globalThis.localStorage?.getItem(this.shelfStorageKey);
      if (value) { const parsed = JSON.parse(value) as ShelfDraft[]; if (Array.isArray(parsed) && parsed.length) return parsed; }
    } catch { /* Usa uma prateleira vazia quando não há dados válidos salvos. */ }
    return [this.newShelf()];
  }

  editGame(game: BoardGame): void {
    this.editingId = game.id;
    this.newCategory = '';
    this.draft = { ...emptyDraft(), ...game, idealPlayers: game.idealPlayers || '', categories: [...game.categories], mechanics: game.mechanics.join(', '),
      year: this.asText(game.year), playersMin: this.asText(game.playersMin), playersMax: this.asText(game.playersMax),
      timeMin: this.asText(game.timeMin), timeMax: this.asText(game.timeMax), age: this.asText(game.age), complexity: this.asText(game.complexity),
      boxLength: this.asText(game.boxLength), boxWidth: this.asText(game.boxWidth), boxHeight: this.asText(game.boxHeight) };
    this.dialogOpen = true;
  }

  saveGame(): void {
    if (!this.draft.name.trim()) return;
    const previous = this.games.find((game) => game.id === this.editingId);
    const game: BoardGame = {
      id: this.editingId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: this.draft.name.trim(), originalName: this.draft.originalName.trim(), year: this.toNumber(this.draft.year),
      playersMin: this.toNumber(this.draft.playersMin), playersMax: this.toNumber(this.draft.playersMax),
      timeMin: this.toNumber(this.draft.timeMin), timeMax: this.toNumber(this.draft.timeMax), age: this.toNumber(this.draft.age),
      idealPlayers: this.draft.idealPlayers.trim(),
      complexity: this.toNumber(this.draft.complexity), designers: this.draft.designers.trim(), artists: this.draft.artists.trim(),
      publishers: this.draft.publishers.trim(), edition: this.draft.edition.trim(), language: this.draft.language.trim(),
      categories: [...this.draft.categories], mechanics: this.parseList(this.draft.mechanics), bggId: this.draft.bggId.trim(),
      bggUrl: this.draft.bggUrl.trim(), ludopediaUrl: this.draft.ludopediaUrl.trim(), boxLength: this.toNumber(this.draft.boxLength),
      boxWidth: this.toNumber(this.draft.boxWidth), boxHeight: this.toNumber(this.draft.boxHeight), notes: this.draft.notes.trim()
    };
    this.games = previous ? this.games.map((entry) => entry.id === game.id ? game : entry) : [...this.games, game];
    this.persistGames();
    this.dialogOpen = false;
  }

  private parseList(value: string): string[] { return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]; }
  private toNumber(value: string | number | null): number | null {
    if (value === null || (typeof value === 'string' && !value.trim())) return null;
    const parsed = typeof value === 'number' ? value : Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  private asText(value: number | null): string { return value === null ? '' : String(value); }
  private loadGames(): BoardGame[] {
    let saved: BoardGame[] = [];
    let deleted: string[] = [];
    try { const value = globalThis.localStorage?.getItem(this.storageKey); saved = value ? JSON.parse(value) as BoardGame[] : []; }
    catch { saved = []; }
    try { deleted = JSON.parse(globalThis.localStorage?.getItem(this.deletedStorageKey) || '[]') as string[]; }
    catch { deleted = []; }
    const merged = new Map(importedCollection.map((game) => [game.id, game]));
    for (const game of saved) {
      const imported = merged.get(game.id);
      merged.set(game.id, {
        ...imported,
        ...game,
        designers: game.designers || imported?.designers || '',
        mechanics: game.mechanics?.length ? game.mechanics : imported?.mechanics || [],
        boxLength: game.boxLength ?? imported?.boxLength ?? null,
        boxWidth: game.boxWidth ?? imported?.boxWidth ?? null,
        boxHeight: game.boxHeight ?? imported?.boxHeight ?? null,
        idealPlayers: game.idealPlayers || imported?.idealPlayers || ''
      });
    }
    for (const id of deleted) merged.delete(id);
    return [...merged.values()];
  }
  private persistGames(): void { try { globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this.games)); } catch (error) { console.warn('Não foi possível salvar os jogos neste navegador.', error); } }
}

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));

