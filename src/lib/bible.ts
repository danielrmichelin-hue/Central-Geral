// ─────────────────────────────────────────────────────────────
// Dados de referência dos 66 livros (estáticos, no front-end).
// O que persiste no banco é só quais capítulos foram lidos.
// ─────────────────────────────────────────────────────────────

export type Testament = 'velho' | 'novo';

export interface BibleBook {
  id: string;
  nome: string;
  testamento: Testament;
  classificacao: string;
  totalCapitulos: number;
  ordem: number;
}

const VT: [string, [string, string, number][]][] = [
  ['Pentateuco', [
    ['genesis', 'Gênesis', 50], ['exodo', 'Êxodo', 40], ['levitico', 'Levítico', 27],
    ['numeros', 'Números', 36], ['deuteronomio', 'Deuteronômio', 34],
  ]],
  ['Históricos', [
    ['josue', 'Josué', 24], ['juizes', 'Juízes', 21], ['rute', 'Rute', 4],
    ['1samuel', '1 Samuel', 31], ['2samuel', '2 Samuel', 24], ['1reis', '1 Reis', 22],
    ['2reis', '2 Reis', 25], ['1cronicas', '1 Crônicas', 29], ['2cronicas', '2 Crônicas', 36],
    ['esdras', 'Esdras', 10], ['neemias', 'Neemias', 13], ['ester', 'Ester', 10],
  ]],
  ['Poéticos', [
    ['jo', 'Jó', 42], ['salmos', 'Salmos', 150], ['proverbios', 'Provérbios', 31],
    ['eclesiastes', 'Eclesiastes', 12], ['cantares', 'Cânticos', 8],
  ]],
  ['Profetas Maiores', [
    ['isaias', 'Isaías', 66], ['jeremias', 'Jeremias', 52], ['lamentacoes', 'Lamentações', 5],
    ['ezequiel', 'Ezequiel', 48], ['daniel', 'Daniel', 12],
  ]],
  ['Profetas Menores', [
    ['oseias', 'Oseias', 14], ['joel', 'Joel', 3], ['amos', 'Amós', 9], ['obadias', 'Obadias', 1],
    ['jonas', 'Jonas', 4], ['miqueias', 'Miqueias', 7], ['naum', 'Naum', 3], ['habacuque', 'Habacuque', 3],
    ['sofonias', 'Sofonias', 3], ['ageu', 'Ageu', 2], ['zacarias', 'Zacarias', 14], ['malaquias', 'Malaquias', 4],
  ]],
];

const NT: [string, [string, string, number][]][] = [
  ['Evangelhos', [
    ['mateus', 'Mateus', 28], ['marcos', 'Marcos', 16], ['lucas', 'Lucas', 24], ['joao', 'João', 21],
  ]],
  ['História', [['atos', 'Atos', 28]]],
  ['Cartas Paulinas', [
    ['romanos', 'Romanos', 16], ['1corintios', '1 Coríntios', 16], ['2corintios', '2 Coríntios', 13],
    ['galatas', 'Gálatas', 6], ['efesios', 'Efésios', 6], ['filipenses', 'Filipenses', 4],
    ['colossenses', 'Colossenses', 4], ['1tessalonicenses', '1 Tessalonicenses', 5],
    ['2tessalonicenses', '2 Tessalonicenses', 3], ['1timoteo', '1 Timóteo', 6], ['2timoteo', '2 Timóteo', 4],
    ['tito', 'Tito', 3], ['filemom', 'Filemom', 1],
  ]],
  ['Cartas Gerais', [
    ['hebreus', 'Hebreus', 13], ['tiago', 'Tiago', 5], ['1pedro', '1 Pedro', 5], ['2pedro', '2 Pedro', 3],
    ['1joao', '1 João', 5], ['2joao', '2 João', 1], ['3joao', '3 João', 1], ['judas', 'Judas', 1],
  ]],
  ['Profético', [['apocalipse', 'Apocalipse', 22]]],
];

function build(): BibleBook[] {
  const books: BibleBook[] = [];
  let ordem = 1;
  for (const [testamento, grupos] of [['velho', VT], ['novo', NT]] as const) {
    for (const [classificacao, livros] of grupos) {
      for (const [id, nome, totalCapitulos] of livros) {
        books.push({ id, nome, testamento, classificacao, totalCapitulos, ordem: ordem++ });
      }
    }
  }
  return books;
}

export const BIBLE_BOOKS: BibleBook[] = build();

export const BIBLE_TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((a, b) => a + b.totalCapitulos, 0); // 1189

export function classificacoesDe(testamento: Testament): string[] {
  return [...new Set(BIBLE_BOOKS.filter((b) => b.testamento === testamento).map((b) => b.classificacao))];
}
