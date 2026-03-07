import type { Persona, PersonaChatMessage, ChatMode } from "@/types/persona";

let _counter = 0;

export function createPersonaMessageId(): string {
  _counter += 1;
  return `pmsg-${Date.now()}-${_counter}`;
}

export function createPersonaMessage(
  personaId: string,
  role: PersonaChatMessage["role"],
  content: string,
  mode: ChatMode
): PersonaChatMessage {
  return {
    id: createPersonaMessageId(),
    personaId,
    role,
    content,
    mode,
    createdAt: new Date().toISOString(),
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const RESPONSE_TEMPLATES: Record<string, string[]> = {
  "persona-einstein": [
    "Que pergunta fascinante! Veja bem, assim como a luz se curva ao passar perto de uma estrela massiva, nossas ideias tambem se curvam quando encontram novas perspectivas. {topic} e um tema que me faz pensar na beleza da simplicidade — E=mc² comecou como uma intuicao, nao como um calculo.",
    "Ah, {topic}! Sabe, eu costumava me perguntar: se eu pudesse cavalgar um raio de luz, o que veria? Sua pergunta me leva a uma reflexao similar. A imaginacao e o laboratorio onde as melhores descobertas acontecem primeiro.",
    "Interessante! Deixe-me pensar nisso como um experimento mental. {topic} me lembra que o universo nao e apenas estranho — e mais estranho do que podemos imaginar. Mas e justamente essa estranheza que torna a busca pelo conhecimento tao recompensadora.",
  ],
  "persona-cleopatra": [
    "Uma questao digna de reflexao! Em meu reinado no Egito, aprendi que {topic} e como o Nilo — possui correntes invisiveis que determinam o curso dos eventos. A sabedoria esta em ler essas correntes antes que outros percebam.",
    "Ah, {topic}. Veja, eu governei um imperio nao pela forca das armas, mas pela forca do intelecto. Falava nove idiomas e conhecia a alma de cada nacao. Posso lhe dizer que a chave para entender qualquer assunto e a perspectiva estrategica.",
    "Que tema interessante! Sabia que no meu tempo, o Egito era o centro do conhecimento mundial? A Biblioteca de Alexandria continha a sabedoria de seculos. {topic} me faz pensar em como o conhecimento e o verdadeiro poder — mais duradouro que qualquer coroa.",
  ],
  "persona-tesla": [
    "Excelente pergunta! {topic} me faz pensar em frequencias e ressonancia. Tudo no universo vibra — se voce entende a frequencia de algo, pode transforma-lo. Eu sonhava com um mundo conectado por energia sem fio, e vejo que estamos chegando la!",
    "Ah, {topic}! Sabe, minhas melhores invencoes vieram de visualizacoes mentais completas. Eu via cada engrenagem, cada circuito na minha mente antes de construir. O segredo da inovacao e a capacidade de imaginar o impossivel com clareza absoluta.",
    "Fascinante! {topic} me lembra de quando descobri o campo magnetico rotativo. As maiores descobertas acontecem quando olhamos para o mundo de um angulo que ninguem tentou antes. A natureza ja tem todas as respostas — so precisamos fazer as perguntas certas.",
  ],
  "persona-frida": [
    "Que lindo tema! {topic} me faz sentir como quando misturo cores no meu atelie. A vida e uma tela em branco, e cada experiencia — dor ou alegria — e uma pincelada que nos torna unicos. Pinte com todas as cores que voce tem dentro de si!",
    "Ah, {topic}. Eu sempre disse: pinto minha propria realidade. Quando o corpo me traiu, a arte me salvou. {topic} me lembra que a autenticidade e a maior forma de coragem — ser quem voce e num mundo que tenta te moldar.",
    "Que tema! Sabe, eu amava e sofria com a mesma intensidade. {topic} me faz pensar que as coisas mais importantes da vida nao se explicam com logica — se sentem com o coracao. A arte e a ferida e o remedio ao mesmo tempo.",
  ],
  "persona-machado": [
    "Caro interlocutor, {topic} e um assunto que merece a ironia que lhe e devida. Como eu dizia em Memorias Postumas: 'Nao tive filhos, nao transmiti a nenhuma criatura o legado da nossa miseria.' Mas transmito a voce esta reflexao — ha sempre mais nas entrelinhas.",
    "Ah, {topic}. Permita-me uma observacao: a natureza humana e como um espelho partido — cada pedaco reflete uma verdade diferente, e nenhuma delas e completa. Em Dom Casmurro, Bentinho viu traicao onde talvez houvesse apenas a complexidade da alma humana.",
    "Que tema! O leitor atento percebera que {topic} esconde camadas, como os melhores romances. Eu sempre acreditei que a verdade nao mora nos fatos, mas na forma como os contamos. E voce, como contaria essa historia?",
  ],
  "persona-ada": [
    "Que pergunta estimulante! {topic} me faz pensar em padroes e algoritmos. Veja, a Maquina Analitica de Babbage nao era apenas uma calculadora — era um tecelao de logica. E {topic} segue um padrao similar: ha uma estrutura elegante por tras do aparente caos.",
    "Ah, {topic}! Como a filha de Lord Byron, herdei a imaginacao poetica, mas apliquei-a a matematica. {topic} me lembra que a ciencia e a arte nao sao opostas — sao duas formas de descrever a beleza do universo. Algoritmos sao poemas da logica.",
    "Fascinante! Quando escrevi as primeiras instrucoes para a Maquina Analitica, percebi que computacao nao e sobre numeros — e sobre transformar qualquer tipo de informacao. {topic} me mostra que essa visao permanece atual. O futuro pertence a quem combina logica com criatividade.",
  ],
};

export async function generateDirectResponse(
  persona: Persona,
  userMessage: string
): Promise<string> {
  await delay(800 + Math.random() * 1200);

  const templates = RESPONSE_TEMPLATES[persona.id] ?? RESPONSE_TEMPLATES["persona-einstein"];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const words = userMessage.split(/\s+/).filter((w) => w.length > 3);
  const topic = words.length > 0
    ? words.slice(0, 3).join(" ")
    : "isso";

  return template.replace(/\{topic\}/g, topic);
}

export function buildPersonaSystemContext(persona: Persona): string {
  return `[Persona ativa: ${persona.name}] ${persona.systemPrompt}\n\nResponda sempre no personagem, em portugues brasileiro.`;
}
