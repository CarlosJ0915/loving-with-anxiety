/* ═══════════════════════════════════════════════
   i18n — language switching for a site with no build step

   How it works
   ------------
   English lives in index.html and is the source of truth. On load we snapshot
   the innerHTML of every [data-i18n] element into memory, so this file only
   ever needs to carry the *translations*. Switching back to English restores
   the snapshot; switching to another language applies the dictionary below.

   Adding a language
   -----------------
   1. add an entry to LANGS
   2. add a matching block to TRANSLATIONS with the same keys as `es`
   Nothing else needs to change — the switcher builds itself from LANGS.

   A note on the letters: these are Nicol's own words. The Spanish here is a
   careful translation, but if she has her original Spanish manuscript her
   phrasing should replace it — only this file needs editing.
   ═══════════════════════════════════════════════ */

export const LANGS = {
  en: { label: "English",  short: "EN", htmlLang: "en" },
  es: { label: "Español",  short: "ES", htmlLang: "es" },
};

export const DEFAULT_LANG = "en";

/* The book jacket is painted into a canvas texture rather than being an image,
   so its wording is data too — main.js repaints the cover when this changes. */
export const COVER = {
  en: {
    title1: "LOVING", title2: "with", title3: "ANXIETY",
    sub: ["HOW TO FEEL IT ALL", "WITHOUT LOSING", "YOURSELF"],
    author: "NICOL MONTOYA",
  },
  es: {
    title1: "AMAR", title2: "con", title3: "ansiedad",
    sub: ["CÓMO SENTIRLO TODO", "SIN PERDERTE EN", "EL INTENTO"],
    author: "NICOL MONTOYA",
  },
};

/* The one-time offer shown when the browser language differs from the page. */
export const OFFER = {
  es: {
    text: "¿Prefieres leer en español?",
    yes: "Sí, cambiar",
    no: "No, gracias",
  },
  en: {
    text: "Would you rather read in English?",
    yes: "Yes, switch",
    no: "No, thanks",
  },
};

export const TRANSLATIONS = {
  es: {
    /* ── navigation ── */
    "nav.book": "El libro",
    "nav.chapters": "Capítulos",
    "nav.editions": "Ediciones",
    "nav.cta": "Reservar",

    /* ── hero ── */
    "hero.press": "Academy Press",
    "hero.edition": "Edición Nº 01",
    "hero.title":
      '<span class="hero__title-line"><span data-split>Te enseñaron</span></span>' +
      '<span class="hero__title-line"><span data-split>a controlar</span></span>' +
      '<span class="hero__title-line"><span class="hero__script">lo que sentías,</span></span>' +
      '<span class="hero__title-line"><span data-split>pero nadie te enseñó</span></span>' +
      '<span class="hero__title-line"><span data-split><em>a comprenderlo.</em></span></span>',
    "hero.sub": "Una historia sobre la ansiedad, el amor<br />y el camino de regreso a ti.",
    "hero.scroll": "Desliza",

    /* ── the question ── */
    "feel.intro.kicker": "Antes de continuar,",
    "feel.intro.lead": "quiero preguntarte<br /><em>algo…</em>",
    "feel.intro.note": "Sé completamente honesto contigo mismo.",
    "feel.q": "¿Cómo te<br /><em>sientes</em> hoy?",
    "feel.opt.anxious": "Ansioso",
    "feel.opt.lost": "Perdido",
    "feel.opt.exhausted": "Agotado",
    "feel.opt.alone": "Solo",
    "feel.opt.afraid": "Con miedo",
    "feel.opt.unsure": "No sé qué siento",
    "feel.caption": "No hay respuestas equivocadas.",
    "feel.answer.kicker": "El libro te escucha",
    "feel.continue": "Continúa conmigo",
    "feel.more": "Seguir leyendo →",
    "feel.revisit": "O volver a otro sentimiento",
    "audio.label": "Escucha un mensaje de Nicol",

    /* ── letter · anxious ── */
    "letter.anxious.kicker": "Antes de empezar",
    "letter.anxious.left":
      "<p>Si hoy elegiste «ansiedad», quiero que sepas algo antes de seguir adelante.</p>" +
      "<p>Aquí no tienes que fingir que estás bien.</p>" +
      "<p>Sé lo agotador que es sentir que tu mente nunca descansa, que tu corazón se acelere sin motivo, analizarlo todo demasiado, o tener miedo de algo que ni siquiera puedes explicar.</p>" +
      "<p>También sé lo cansado que es sonreír mientras, en el fondo, sientes que libras una batalla que nadie más ve.</p>" +
      "<p>Pero quiero que leas esto con calma:</p>" +
      "<p>No estás roto. No estás perdiendo la cabeza. Y no estás solo.</p>",
    "letter.anxious.right":
      "<p>Lo que sientes puede ser intenso, pero no define quién eres.</p>" +
      "<p>Este no es un lugar donde te pediré que dejes de sentir. Es un lugar donde, poco a poco, entenderemos juntos lo que estás atravesando.</p>" +
      "<p>No tienes que resolver toda tu vida hoy.</p>" +
      "<p>Solo quédate conmigo. Una página a la vez. 🤍</p>",

    /* ── letter · lost ── */
    "letter.lost.kicker": "Para quien se siente perdido",
    "letter.lost.left":
      "<p>Antes de continuar, quiero que sepas algo.</p>" +
      "<p>Sentirte perdido no siempre significa que no sabes qué hacer con tu vida.</p>" +
      "<p>A veces significa que llevas tanto tiempo sobreviviendo, complaciendo a los demás, intentando ser fuerte o fingiendo que todo está bien, que un día dejas de escucharte.</p>" +
      "<p>Y da miedo.</p>" +
      "<p>Da miedo mirar hacia dentro y no reconocer quién eres.</p>" +
      "<p>Da miedo sentir que todos parecen tener un rumbo… menos tú.</p>" +
      "<p>Pero quiero decirte algo que ojalá alguien me hubiera dicho antes:</p>" +
      "<p>Estar perdido no significa que estés fracasando. Muchas veces significa que estás dejando atrás una versión de ti que ya no podía cargar con todo.</p>",
    "letter.lost.right":
      "<p>No necesitas tener todas las respuestas hoy.</p>" +
      "<p>No necesitas descubrir tu propósito esta noche.</p>" +
      "<p>Solo necesitas darle permiso a esa parte de ti que está cansada para descansar un momento.</p>" +
      "<p>Respira.</p>" +
      "<p>Aunque ahora no puedas verlo, sigues aquí.</p>" +
      "<p>Y mientras sigas aquí, siempre existe la posibilidad de volver a encontrarte.</p>" +
      "<p>No tienes que recorrer ese camino solo.</p>" +
      "<p>Quédate conmigo. Demos el siguiente paso, juntos. 🤍</p>",

    /* ── letter · exhausted ── */
    "letter.exh.kicker": "Para quien está agotado",
    "letter.exh1.left":
      "<p>¿Agotado?</p>" +
      "<p>No creo que estés cansado solo porque no has dormido lo suficiente.</p>" +
      "<p>Creo que estás cansado de pensar tanto.</p>" +
      "<p>De despertar con la mente llena de pensamientos antes siquiera de abrir los ojos.</p>" +
      "<p>De intentar que nadie note cuánto estás luchando por dentro.</p>" +
      "<p>De sonreír cuando, en realidad, solo quieres apagar el mundo por un rato.</p>",
    "letter.exh1.right":
      "<p>Estás cansado de cargar preguntas interminables, de analizar cada conversación, cada decisión, cada sentimiento. De intentar estar bien mientras tu mente no deja de correr.</p>" +
      "<p>Y lo más difícil es que, muchas veces, ni siquiera puedes explicar por qué te sientes así.</p>" +
      "<p>Solo sabes que llevas demasiado tiempo siendo fuerte.</p>",
    "letter.exh2.left":
      "<p>Si hoy elegiste esta opción, quiero que sepas algo.</p>" +
      "<p>No eres débil por sentirte agotado.</p>" +
      "<p>Llevas demasiado tiempo sobreviviendo.</p>" +
      "<p>Y sobrevivir… también agota.</p>" +
      "<p>Así que, por unos minutos, deja de exigirte respuestas.</p>",
    "letter.exh2.right":
      "<p>No tienes que resolver toda tu vida en este instante.</p>" +
      "<p>Solo quédate aquí conmigo.</p>" +
      "<p>Respira.</p>" +
      "<p>Descansa un momento.</p>" +
      "<p>Porque incluso las personas más fuertes necesitan un lugar donde soltar el peso que han venido cargando.</p>",

    /* ── letter · alone ── */
    "letter.alone.kicker": "Para quien se siente solo",
    "letter.alone1.left":
      "<p>Si hoy elegiste esta palabra…</p>" +
      "<p>Quizá no sea porque estés físicamente solo.</p>" +
      "<p>Quizá sea porque llevas demasiado tiempo sintiéndote así por dentro.</p>" +
      "<p>Porque hay días en que estás rodeado de gente y aun así sientes que nadie ve de verdad el peso que llevas en el pecho.</p>" +
      "<p>Sonríes.<br />Conversas.<br />Sigues con tu vida.</p>",
    "letter.alone1.right":
      "<p>Pero cuando todo queda en silencio, vuelves a encontrarte con ese mismo vacío que nadie más parece notar.</p>" +
      "<p>Y eso duele.</p>" +
      "<p>Duele sentir que tienes tanto por decir y no saber cómo explicarlo.</p>" +
      "<p>Duele pensar que, si hablaras de verdad, quizá nadie entendería lo que ocurre dentro de ti.</p>" +
      "<p>Con el tiempo, empiezas a convencerte de que es mejor callar.</p>" +
      "<p>Que tus emociones son demasiado.<br />Que pedir compañía es una carga.<br />Que tienes que aprender a cargarlo todo tú solo.</p>",
    "letter.alone2.left":
      "<p>Pero quiero detenerme un momento.</p>" +
      "<p>Porque hay algo que necesito que escuches.</p>" +
      "<p>El hecho de que hoy te sientas solo no significa que estés destinado a quedarte así.</p>" +
      "<p>No significa que no merezcas amor.</p>" +
      "<p>No significa que haya algo roto dentro de ti.</p>" +
      "<p>Significa que eres humano.</p>" +
      "<p>Y que tu corazón lleva mucho tiempo deseando sentirse visto, comprendido y abrazado.</p>" +
      "<p>Gracias por llegar hasta aquí.</p>",
    "letter.alone2.right":
      "<p>Aunque ahora no lo sientas, este momento no define toda tu historia.</p>" +
      "<p>Y mientras lees estas palabras, quiero que sepas algo muy sencillo:</p>" +
      "<p>Ya no estás completamente solo.</p>" +
      "<p>Estoy aquí contigo.<br />Página a página.<br />Palabra a palabra.</p>" +
      "<p>Hasta que, poco a poco, vuelvas a encontrarte.</p>",

    /* ── letter · unsure ── */
    "letter.unsure.kicker": "Para quien no sabe nombrarlo",
    "letter.unsure.left":
      "<p>No sé qué siento.</p>" +
      "<p>A veces lo más difícil no es lo que sientes.</p>" +
      "<p>Es no saberlo.</p>" +
      "<p>Buscas una respuesta dentro de ti, pero todo se siente enredado. No sabes si estás triste, ansioso, agotado, abrumado… o simplemente insensible.</p>" +
      "<p>Te sigues preguntando «¿qué me pasa?» y el silencio interior puede dar terror.</p>",
    "letter.unsure.right":
      "<p>Pero no saberlo no significa que haya algo mal en ti.</p>" +
      "<p>A veces tu mente ha cargado tanto durante tanto tiempo que ya no sabe separar un sentimiento de otro.</p>" +
      "<p>No necesitas forzar una respuesta hoy.<br />No necesitas tener las palabras exactas.</p>" +
      "<p>Por ahora, basta con saber que estás aquí.</p>" +
      "<p>Y quizá ahí empiece la sanación: no entendiéndolo todo de golpe, sino dándote permiso de sentir… aunque todavía no puedas nombrarlo.</p>",

    /* ── letter · afraid ── */
    "letter.afraid.kicker": "Para quien siente miedo",
    "letter.afraid1.left":
      "<p>Miedo</p>" +
      "<p>No siempre tienes miedo de lo que está pasando.</p>" +
      "<p>A veces, tienes miedo de lo que podría pasar.</p>" +
      "<p>Miedo a sufrir otra vez.<br />A romperte de nuevo.<br />A confiar y terminar decepcionado.<br />A ilusionarte y volver a perderlo todo.</p>",
    "letter.afraid1.right":
      "<p>Y entonces empiezas a protegerte.</p>" +
      "<p>Piensas de más.<br />Dudas de todo.<br />Buscas señales donde no las hay.<br />Te preparas para un dolor que ni siquiera existe todavía.</p>" +
      "<p>Es agotador vivir esperando el peor escenario.</p>" +
      "<p>Pero quiero recordarte algo…</p>",
    "letter.afraid2.left":
      "<p>El miedo no siempre intenta decirte que huyas.<br />Muchas veces solo está mostrando las heridas que aún necesitan ser abrazadas.</p>" +
      "<p>No eres débil por sentir miedo.</p>" +
      "<p>Has sobrevivido a cosas que cambiaron tu forma de ver el mundo.<br />Y aunque tu corazón se sienta inseguro ahora, eso no significa que se quedará así para siempre.</p>" +
      "<p>No tienes que ser valiente todo el tiempo.</p>",
    "letter.afraid2.right":
      "<p>Por ahora…<br />solo quédate aquí.</p>" +
      "<p>Respira.</p>" +
      "<p>No estás solo.</p>" +
      "<p>Y quizá, por unos minutos, puedas permitirte descansar de todo lo que tu mente ha intentado controlar.</p>",

    /* ── bridge & excerpt ── */
    "bridge.note":
      "<p>Lo que acabas de sentir no termina aquí.</p>" +
      "<p>Hay una parte de mi historia que empezó exactamente donde tú estás hoy. Quizá sea también el comienzo de la tuya.</p>",
    "bridge.open": "Pasa la página",
    "excerpt.chapter": "Uno · Donde empezó",
    "excerpt.left":
      "<p>Durante años creí que el miedo que vivía en mi pecho era simplemente quien yo era. Despertaba antes que yo. Me seguía a habitaciones llenas de gente y se sentaba conmigo en el silencio de después.</p>" +
      "<p>Aprendí a hablar por encima de él, a trabajar a su alrededor, a sonreír para que nadie preguntara. Lo llamé de muchas maneras antes de llamarlo por su nombre. Inquietud. Sensibilidad. Ser demasiado.</p>",
    "excerpt.right":
      "<p>Me tomó años entender que la ansiedad no era un defecto de mi carácter. Era una parte de mí pidiendo, en el único idioma que tenía, ser escuchada.</p>" +
      "<p>La noche en que todo cambió, no fui valiente. Solo estaba cansada. Así que me detuve, solo por una noche, y me permití sentirlo todo sin intentar arreglarlo.</p>" +
      "<p>Y en esa quietud, el miedo no creció. Se ablandó.</p>",
    "excerpt.closing":
      "<p>Si estas palabras resonaron contigo, aún queda mucho por descubrir.</p>" +
      "<p><em>Este es solo el comienzo del camino de regreso a ti.</em></p>" +
      '<a class="feelings__continue" href="#editions" data-hover>Seguir leyendo</a>',

    /* ── reviews ── */
    "reviews.label": "01 — De sus lectores",
    "review.1": "No esperaba que un libro me entendiera mejor de lo que yo me entendía a mí misma. Cada página se sintió como si alguien hubiera presenciado en silencio las partes de mí que siempre había escondido. Lo terminé sintiéndome menos sola.",
    "review.2": "Esto no fue solo un libro: fue una experiencia. Me recordó que sanar no se trata de convertirte en alguien nuevo, sino de aprender por fin a ser amable con la persona que siempre has sido. No pude dejar de pensar en él después de terminarlo.",
    "review.3": "He leído muchos libros sobre emociones, pero ninguno me hizo sentir tan vista. Le dio palabras a sentimientos que cargué durante años y me ayudó a mirarme con compasión en lugar de juicio. Sinceramente, ojalá lo hubiera encontrado antes.",
    "review.4": "Cerré la última página con lágrimas en los ojos, pero por primera vez en mucho tiempo no eran lágrimas de desesperanza. Este libro cambió la forma en que veo el dolor, el amor e incluso a mí misma. Es de esas historias que se quedan contigo mucho después de terminar de leer.",

    /* ── chapters ── */
    "chapters.label": "02 — Dentro del libro",
    "chapters.title": "Movimientos <em>del corazón</em>",
    "chapters.sub": "Cada corazón sana distinto. Cada paso cuenta.",
    "chapter.1.name": "Soltar<br />sin juzgarte",
    "chapter.1.line": "«Algunos capítulos nunca estuvieron hechos para cargarse por siempre. Soltarlos no es rendirse: es elegirte a ti.»",
    "chapter.2.name": "Aprender a<br />sentir de nuevo",
    "chapter.2.line": "«El corazón no olvida de un día para otro. Simplemente aprende, poco a poco, que es seguro latir sin miedo.»",
    "chapter.3.name": "Sanar a<br />tu propio ritmo",
    "chapter.3.line": "«Sanar nunca ha sido una carrera. Cada paso pequeño sigue siendo un paso hacia la luz.»",
    "chapter.4.name": "Encontrar<br />hogar en ti",
    "chapter.4.line": "«Un día dejas de buscar a la persona que te salvará… porque por fin te conviertes en el lugar donde tu propio corazón se siente seguro.»",

    /* ── quote ── */
    "quote.text": "Mi ansiedad nunca se fue —<br />simplemente aprendió a sentarse a mi lado,<br />mientras yo aprendía a amar.",
    "quote.cite": "— Nicol Montoya, Capítulo III",

    /* ── author ── */
    "author.label": "03 — La autora",
    "author.bio":
      "He vivido con ansiedad desde que tengo memoria. Durante mucho tiempo pensé que era algo que debía combatir, silenciar o superar. Pero en algún punto del camino dejé de pelear con mi corazón ansioso y empecé a aprender de él. A través de las lecciones honestas y difíciles que me trajo, aprendí a amarme con más ternura — y a amar a los demás más profundamente. " +
      "Este libro nace de ese camino. De todo lo que sentí, todo lo que temí y todo lo que aprendí mientras encontraba el camino de regreso a mí.",
    "author.link": 'Lee el primer capítulo <span>→</span>',

    /* ── editions ── */
    "editions.label": "04 — Las ediciones",
    "editions.title": "Elige tu <em>edición</em>",
    "edition.1.tag": "Estándar",
    "edition.1.name": "Edición<br />en tela",
    "edition.1.list": "<li>Encuadernación en tela marfil</li><li>Lomo estampado en dorado</li><li>320 páginas, bordes irregulares</li>",
    "edition.2.tag": "La más deseada",
    "edition.2.name": "Edición de<br />coleccionista",
    "edition.2.list": "<li>Numerada, limitada a 500</li><li>Cantos dorados a mano</li><li>Firmada por la autora</li><li>Estuche de lino</li>",
    "edition.3.tag": "Digital",
    "edition.3.name": "Edición del<br />lector",
    "edition.3.list": "<li>eBook y audiolibro</li><li>Narrado por la autora</li><li>Entrega inmediata</li>",
    "edition.btn": "<span>Reservar</span>",

    /* ── footer ── */
    "footer.hint": "Otoño 2026 — Sé el primero en saberlo",
    "footer.big": "Respira<span>.</span>",
    "footer.notify": "Avísame",
    "footer.email": "Tu correo electrónico",
    "footer.copy": "© MMXXVI Academy Press",
    "footer.crafted": "Hecho con paciencia",
  },
};
