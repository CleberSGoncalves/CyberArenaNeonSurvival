/**
 * @fileoverview Full Bilingual Localization (EN / PT-BR) for Cyber Arena: Neon Survival
 * Auto-detects user locale with instant manual toggle and persistence.
 */

import { storage } from './storage.js';

const TRANSLATIONS = {
  en: {
    // Game Title & Metadata
    title: 'Cyber Arena: Neon Survival',
    subtitle: 'Cyberpunk 2D Battle Royale',
    loading: 'INITIALIZING NEURAL LINK...',
    tapToStart: 'CLICK OR TAP TO DEPLOY',

    // Splash & Lore
    skipStory: 'SKIP STORY ➔',
    startGame: 'ENTER ARENA NOW',
    continueBtn: 'NEXT ACT ➔',
    loreAct1Title: 'ACT I: THE DIGITAL CORRIDORS',
    loreAct1Text: 'Neo-Kyoto is gripped by rogue mega-corporations. Outcast cyber-hackers are cast into the high-voltage Neon Grid, where only true lethal skill earns freedom.',
    loreAct2Title: 'ACT II: THE FIREWALL CONVERGENCE',
    loreAct2Text: 'A deadly collapsing firewall shrinks the arena without mercy. Scavenge plasma rifles, EMP railguns and nanite shields from holographic supply crates.',
    loreAct3Title: 'ACT III: #1 SURVIVAL SUPREMACY',
    loreAct3Text: 'Out-maneuver AI enforcers, dash through laser barricades, and eliminate all rival hackers. Only the last survivor standing hacks their way to liberation.',

    // HUD
    sector: 'SECTOR',
    living: 'ALIVE',
    kills: 'KILLS',
    stormTime: 'FIREWALL',
    stormClosing: 'WARNING: FIREWALL COLLAPSE IN PROGRESS!',
    stormSafe: 'ZONE STABLE',
    completeSectorBtn: '✅ COMPLETE SECTOR (★) ➔',
    pause: 'PAUSE',
    resume: 'RESUME',
    restart: 'RESTART MATCH',
    menu: 'SECTORS',
    soundOn: 'AUDIO: ON',
    soundOff: 'AUDIO: MUTED',

    // Objectives & Stars
    star1Goal: '★ Reach Top 3 or 2 Kills',
    star2Goal: '★★ Finish < Par-Time (80s) or HP > 50%',
    star3Goal: '★★★ #1 Lone Survivor Champion',
    starEarned: 'STAR ACHIEVED!',

    // Modals
    victoryTitle: '★ #1 SURVIVAL VICTORY! ★',
    victorySubtitle: 'You are the Lone Champion of the Cyber Arena!',
    defeatTitle: 'SYSTEM SHUTDOWN - DEFEATED',
    defeatSubtitle: 'Your neural link was severed. Reroute and try again!',
    nextSectorBtn: 'NEXT SECTOR ➔',
    doubleCreditsBtn: 'DOUBLE CREDITS (+100%) [AD]',
    reviveBtn: 'EMERGENCY REVIVE (SHIELD + 3s INVULN) [AD]',
    creditsEarned: 'CYBER-CREDITS EARNED',
    scoreEarned: 'MATCH SCORE',
    timeElapsed: 'SURVIVAL TIME',

    // Shop & Upgrades
    shopTitle: 'CYBERNETIC BLACK MARKET',
    upgradesTab: 'UPGRADES',
    skinsTab: 'CYBER SKINS',
    equipped: 'EQUIPPED',
    equip: 'EQUIP',
    buy: 'BUY',
    maxed: 'MAX LEVEL',
    hpUpgradeTitle: 'Nanite Frame (+20 Max HP)',
    shieldUpgradeTitle: 'Overclocked Shield (+15 Max Shield)',
    dashUpgradeTitle: 'Neural Dash (-10% Cooldown)',
    damageUpgradeTitle: 'Plasma Mod (+8% Weapon Damage)',

    // Daily & Lucky Spin & Quests
    dailyTitle: '7-DAY PROTOCOL REWARDS',
    claimReward: 'CLAIM PROTOCOL',
    claimed: 'CLAIMED',
    luckySpinTitle: 'NEURAL LUCKY SPIN',
    spinFree: 'FREE SPIN',
    spinAd: 'EXTRA SPIN [AD]',
    questsTitle: 'TACTICAL BOUNTY QUESTS',
    dailyQuests: 'DAILY CONTRACTS',
    weeklyQuests: 'WEEKLY CONTRACTS',
    claimQuest: 'COLLECT',
    quest2x: '2X REWARD [AD]',

    // Controls
    controlsHelp: 'WASD / ARROWS: Move | MOUSE: Aim & Fire | SPACE / SHIFT: Cyber Dash | Q: Shield Battery | E / F: Loot Crate',

    // Maps
    mapsTitle: 'CYBER ARENA SELECTION',
    mapsSelect: 'ARENAS',
    deployMap: 'DEPLOY TO ARENA ➔',
    loadingMap: 'DECRYPTING NEURAL SECTOR PROTOCOLS...',
    mapNeonDistrict: 'Neon District',
    mapCyberGrid: 'Cyber Grid',
    mapIndustrialSector: 'Industrial Sector'
  },
  pt: {
    // Game Title & Metadata
    title: 'Cyber Arena: Neon Survival',
    subtitle: 'Battle Royale 2D Cyberpunk',
    loading: 'INICIALIZANDO CONEXÃO NEURAL...',
    tapToStart: 'CLIQUE OU TOQUE PARA ENTRAR',

    // Splash & Lore
    skipStory: 'PULAR HISTÓRIA ➔',
    startGame: 'ENTRAR NA ARENA',
    continueBtn: 'PRÓXIMO ATO ➔',
    loreAct1Title: 'ATO I: OS CORREDORES DIGITAIS',
    loreAct1Text: 'Neo-Kyoto é dominada por mega-corporações impiedosas. Hackers rejeitados são arremessados na mortal Arena Neon, onde apenas a sobrevivência concede liberdade.',
    loreAct2Title: 'ATO II: A CONVERGÊNCIA DO FIREWALL',
    loreAct2Text: 'Um anel letal de firewall se contrai sem trégua. Colete rifles de plasma, canhões de trilho EMP e escudos de nanites em caixas holográficas de suprimentos.',
    loreAct3Title: 'ATO III: #1 SUPREMACIA DO SOBREVIVENTE',
    loreAct3Text: 'Supere drones corporativos e hackers rivais, use o Cyber Dash para desviar de disparos e elimine todos os adversários até restar apenas você!',

    // HUD
    sector: 'SETOR',
    living: 'VIVOS',
    kills: 'ELIMINAÇÕES',
    stormTime: 'FIREWALL',
    stormClosing: 'ALERTA: FIREWALL EM COLAPSO!',
    stormSafe: 'ZONA ESTÁVEL',
    completeSectorBtn: '✅ CONCLUIR FASE (★) ➔',
    pause: 'PAUSA',
    resume: 'CONTINUAR',
    restart: 'REINICIAR PARTIDA',
    menu: 'SETORES',
    soundOn: 'ÁUDIO: LIGADO',
    soundOff: 'ÁUDIO: MUTADO',

    // Objectives & Stars
    star1Goal: '★ Ficar no Top 3 ou 2 Eliminações',
    star2Goal: '★★ Tempo Par (< 80s) ou HP > 50%',
    star3Goal: '★★★ #1 Último Sobrevivente Campeão',
    starEarned: 'ESTRELA CONQUISTADA!',

    // Modals
    victoryTitle: '★ VITÓRIA #1 CAMPEÃO! ★',
    victorySubtitle: 'Você conquistou a sobrevivência e a liberdade na Cyber Arena!',
    defeatTitle: 'CONEXÃO NEURAL INTERROMPIDA',
    defeatSubtitle: 'Seu avatar digital foi eliminado. Reconfigure e tente novamente!',
    nextSectorBtn: 'PRÓXIMO SETOR ➔',
    doubleCreditsBtn: 'DOBRAR MOEDAS (+100%) [ANÚNCIO]',
    reviveBtn: 'REVIVER DE EMERGÊNCIA (ESCUDO + 3s INVULN) [ANÚNCIO]',
    creditsEarned: 'CRÉDITOS OBTIDOS',
    scoreEarned: 'PONTUAÇÃO',
    timeElapsed: 'TEMPO DE SOBREVIVÊNCIA',

    // Shop & Upgrades
    shopTitle: 'MERCADO NEGRO CIBERNÉTICO',
    upgradesTab: 'MELHORIAS',
    skinsTab: 'VISUAIS',
    equipped: 'EQUIPADO',
    equip: 'EQUIPAR',
    buy: 'COMPRAR',
    maxed: 'NÍVEL MÁXIMO',
    hpUpgradeTitle: 'Estrutura Nanite (+20 HP Máx)',
    shieldUpgradeTitle: 'Escudo Overclock (+15 Escudo Máx)',
    dashUpgradeTitle: 'Cyber Dash Neural (-10% Recarga)',
    damageUpgradeTitle: 'Módulo de Plasma (+8% Dano)',

    // Daily & Lucky Spin & Quests
    dailyTitle: 'PROTOCOLO DIÁRIO DE RECOMPENSAS (7 DIAS)',
    claimReward: 'COLETAR RECOMPENSA',
    claimed: 'COLETADO',
    luckySpinTitle: 'ROLETA DA SORTE NEON',
    spinFree: 'GIRO GRÁTIS',
    spinAd: 'GIRO EXTRA [ANÚNCIO]',
    questsTitle: 'MISSÕES E CONTRATOS TÁTICOS',
    dailyQuests: 'MISSÕES DIÁRIAS',
    weeklyQuests: 'MISSÕES SEMANAIS',
    claimQuest: 'RESGATAR',
    quest2x: 'DOBRAR [ANÚNCIO]',

    // Controls
    controlsHelp: 'WASD / SETAS: Mover | MOUSE: Mirar e Atirar | ESPAÇO / SHIFT: Cyber Dash | Q: Bateria de Escudo | E / F: Abrir Caixa',

    // Maps
    mapsTitle: 'SELEÇÃO DE ARENA CYBERPUNK',
    mapsSelect: 'ARENAS',
    deployMap: 'ENTRAR NA ARENA ➔',
    loadingMap: 'DECRIPTANDO PROTOCOLOS DE SETOR NEURAL...',
    mapNeonDistrict: 'Distrito Neon',
    mapCyberGrid: 'Grade Cibernética',
    mapIndustrialSector: 'Setor Industrial'
  }
};

export class I18nManager {
  constructor() {
    this.locale = this._detectLocale();
  }

  _detectLocale() {
    const saved = storage.data?.settings?.locale;
    if (saved && (saved === 'en' || saved === 'pt')) {
      return saved;
    }
    if (typeof navigator !== 'undefined') {
      const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (lang.startsWith('pt')) return 'pt';
    }
    return 'en';
  }

  setLocale(locale) {
    if (locale === 'en' || locale === 'pt') {
      this.locale = locale;
      storage.save({ settings: { ...storage.data.settings, locale } });
    }
  }

  toggleLocale() {
    this.setLocale(this.locale === 'en' ? 'pt' : 'en');
    return this.locale;
  }

  t(key) {
    const table = TRANSLATIONS[this.locale] || TRANSLATIONS.en;
    return table[key] !== undefined ? table[key] : (TRANSLATIONS.en[key] || key);
  }
}

export const i18n = new I18nManager();
