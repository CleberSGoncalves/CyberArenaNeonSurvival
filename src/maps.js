/**
 * @fileoverview Modular Maps System for Cyber Arena: Neon Survival
 * 3 Distinct Cyberpunk Battlegrounds:
 * 1. "Neon District" - Megacity streets with neon holographic obstacles & corporate ads
 * 2. "Cyber Grid" - Virtual matrix mainframe with data monoliths & digital glitch storm
 * 3. "Industrial Sector" - Rust-and-oil cybernetic factory wasteland with destructible fuel tanks & steam vents
 */

export const MAPS = [
  {
    id: 'neon_district',
    name: 'Neon District',
    namePt: 'Distrito Neon',
    tagline: 'Mega-City Sector 07 • Corporate Battleground',
    taglinePt: 'Setor 07 da Megacidade • Campo de Batalha Corporativo',
    theme: 'neon',
    bgColor: '#030712',
    gridColor: 'rgba(0, 245, 255, 0.12)',
    accentColor: '#00f5ff',
    secondaryColor: '#d946ef',
    hazardColor: 'rgba(217, 70, 239, 0.25)',
    stormBorderColor: '#d946ef',
    stormPulseColor: '#f43f5e',
    arenaWidth: 2600,
    arenaHeight: 2600,
    ambientParticles: 'sparks',
    initialBotCount: 15,
    stormStartDelay: 6.0,
    stormShrinkSpeed: 16.5,
    icon: '🏙️',
    description: 'Chuva ácida, asfalto molhado e arranha-céus corporativos. Combate em esquinas fechadas e praças com telões holográficos.',
    descriptionEn: 'Acid rain, wet asphalt, and corporate skyscrapers. Tight urban alleys and plazas with glowing neon billboards.',
    obstacles: [
      // Central Corporate Plaza
      { x: 1200, y: 1200, w: 200, h: 200, type: 'building', name: 'Zion Tower Core', color: '#0f172a', borderColor: '#00f5ff' },
      // North Plaza Wings
      { x: 950, y: 900, w: 220, h: 80, type: 'billboard', name: 'MegaCorp Hologram', color: '#1e1b4b', borderColor: '#d946ef' },
      { x: 1430, y: 900, w: 220, h: 80, type: 'billboard', name: 'CyberDyne Ad', color: '#1e1b4b', borderColor: '#00f5ff' },
      // South Plaza Wings
      { x: 950, y: 1620, w: 220, h: 80, type: 'billboard', name: 'NeuralNet Sign', color: '#1e1b4b', borderColor: '#00f5ff' },
      { x: 1430, y: 1620, w: 220, h: 80, type: 'billboard', name: 'Kinomuse Terminal', color: '#1e1b4b', borderColor: '#d946ef' },
      // Western Alleys & Server Blocks
      { x: 450, y: 600, w: 100, h: 350, type: 'server_block', name: 'Data Hub Alpha', color: '#0f172a', borderColor: '#38bdf8' },
      { x: 450, y: 1200, w: 100, h: 200, type: 'server_block', name: 'Data Hub Beta', color: '#0f172a', borderColor: '#38bdf8' },
      { x: 450, y: 1650, w: 100, h: 350, type: 'server_block', name: 'Data Hub Gamma', color: '#0f172a', borderColor: '#38bdf8' },
      // Eastern Alleys & Server Blocks
      { x: 2050, y: 600, w: 100, h: 350, type: 'server_block', name: 'Relay Delta', color: '#0f172a', borderColor: '#f43f5e' },
      { x: 2050, y: 1200, w: 100, h: 200, type: 'server_block', name: 'Relay Epsilon', color: '#0f172a', borderColor: '#f43f5e' },
      { x: 2050, y: 1650, w: 100, h: 350, type: 'server_block', name: 'Relay Zeta', color: '#0f172a', borderColor: '#f43f5e' },
      // Corner Fortified Compounds
      { x: 750, y: 400, w: 300, h: 90, type: 'barricade', name: 'Security Wall NW', color: '#020617', borderColor: '#00f5ff' },
      { x: 1550, y: 400, w: 300, h: 90, type: 'barricade', name: 'Security Wall NE', color: '#020617', borderColor: '#00f5ff' },
      { x: 750, y: 2110, w: 300, h: 90, type: 'barricade', name: 'Security Wall SW', color: '#020617', borderColor: '#d946ef' },
      { x: 1550, y: 2110, w: 300, h: 90, type: 'barricade', name: 'Security Wall SE', color: '#020617', borderColor: '#d946ef' },
    ],
    destructibleCovers: [
      { x: 1100, y: 1100, w: 50, h: 50, hp: 60, maxHp: 60, type: 'destructible_crate', color: '#eab308' },
      { x: 1450, y: 1100, w: 50, h: 50, hp: 60, maxHp: 60, type: 'destructible_crate', color: '#eab308' },
      { x: 1100, y: 1450, w: 50, h: 50, hp: 60, maxHp: 60, type: 'destructible_crate', color: '#eab308' },
      { x: 1450, y: 1450, w: 50, h: 50, hp: 60, maxHp: 60, type: 'destructible_crate', color: '#eab308' },
      { x: 800, y: 1300, w: 60, h: 60, hp: 80, maxHp: 80, type: 'fuel_cell', color: '#f43f5e' },
      { x: 1750, y: 1300, w: 60, h: 60, hp: 80, maxHp: 80, type: 'fuel_cell', color: '#f43f5e' }
    ]
  },
  {
    id: 'cyber_grid',
    name: 'Cyber Grid',
    namePt: 'Grade Cibernética',
    tagline: 'Neural Mainframe Arena • Digital Firewall Clash',
    taglinePt: 'Mainframe Neural • Batalha no Firewall Digital',
    theme: 'matrix',
    bgColor: '#021814',
    gridColor: 'rgba(16, 185, 129, 0.15)',
    accentColor: '#10b981',
    secondaryColor: '#06b6d4',
    hazardColor: 'rgba(16, 185, 129, 0.22)',
    stormBorderColor: '#10b981',
    stormPulseColor: '#34d399',
    arenaWidth: 2800,
    arenaHeight: 2800,
    ambientParticles: 'matrix_bits',
    initialBotCount: 15,
    stormStartDelay: 5.0,
    stormShrinkSpeed: 18.0,
    icon: '⚡',
    description: 'Um mainframe neural com circuitos condutivos, nós quânticos e data-monólitos que bloqueiam pulsos de tiro.',
    descriptionEn: 'A neural matrix mainframe with conductive bus tracks, quantum nodes, and towering data monoliths.',
    obstacles: [
      // Central Data Core Complex (4 monoliths)
      { x: 1150, y: 1150, w: 140, h: 140, type: 'monolith', name: 'Quantum Core 01', color: '#064e3b', borderColor: '#10b981' },
      { x: 1510, y: 1150, w: 140, h: 140, type: 'monolith', name: 'Quantum Core 02', color: '#064e3b', borderColor: '#10b981' },
      { x: 1150, y: 1510, w: 140, h: 140, type: 'monolith', name: 'Quantum Core 03', color: '#064e3b', borderColor: '#10b981' },
      { x: 1510, y: 1510, w: 140, h: 140, type: 'monolith', name: 'Quantum Core 04', color: '#064e3b', borderColor: '#10b981' },
      // Firewall Perimeter Barriers
      { x: 800, y: 700, w: 400, h: 70, type: 'firewall', name: 'Logic Gate A', color: '#022c22', borderColor: '#06b6d4' },
      { x: 1600, y: 700, w: 400, h: 70, type: 'firewall', name: 'Logic Gate B', color: '#022c22', borderColor: '#06b6d4' },
      { x: 800, y: 2030, w: 400, h: 70, type: 'firewall', name: 'Logic Gate C', color: '#022c22', borderColor: '#06b6d4' },
      { x: 1600, y: 2030, w: 400, h: 70, type: 'firewall', name: 'Logic Gate D', color: '#022c22', borderColor: '#06b6d4' },
      // Lateral Cross Nodes
      { x: 500, y: 1250, w: 250, h: 80, type: 'server_block', name: 'Node West', color: '#042f2e', borderColor: '#10b981' },
      { x: 2050, y: 1250, w: 250, h: 80, type: 'server_block', name: 'Node East', color: '#042f2e', borderColor: '#10b981' },
      { x: 1360, y: 450, w: 80, h: 250, type: 'server_block', name: 'Node North', color: '#042f2e', borderColor: '#10b981' },
      { x: 1360, y: 2100, w: 80, h: 250, type: 'server_block', name: 'Node South', color: '#042f2e', borderColor: '#10b981' }
    ],
    destructibleCovers: [
      { x: 1370, y: 1370, w: 60, h: 60, hp: 100, maxHp: 100, type: 'encryption_core', color: '#34d399' },
      { x: 950, y: 1000, w: 50, h: 50, hp: 50, maxHp: 50, type: 'data_pod', color: '#06b6d4' },
      { x: 1800, y: 1000, w: 50, h: 50, hp: 50, maxHp: 50, type: 'data_pod', color: '#06b6d4' },
      { x: 950, y: 1750, w: 50, h: 50, hp: 50, maxHp: 50, type: 'data_pod', color: '#06b6d4' },
      { x: 1800, y: 1750, w: 50, h: 50, hp: 50, maxHp: 50, type: 'data_pod', color: '#06b6d4' }
    ]
  },
  {
    id: 'industrial_sector',
    name: 'Industrial Sector',
    namePt: 'Setor Industrial',
    tagline: 'Decommissioned Cyber Factory • Toxic Hazard Zone',
    taglinePt: 'Fábrica Desativada • Zona Tóxica e Explosiva',
    theme: 'industrial',
    bgColor: '#180f08',
    gridColor: 'rgba(245, 158, 11, 0.12)',
    accentColor: '#f59e0b',
    secondaryColor: '#ef4444',
    hazardColor: 'rgba(239, 68, 68, 0.25)',
    stormBorderColor: '#ea580c',
    stormPulseColor: '#f97316',
    arenaWidth: 2500,
    arenaHeight: 2500,
    ambientParticles: 'embers',
    initialBotCount: 15,
    stormStartDelay: 6.5,
    stormShrinkSpeed: 17.0,
    icon: '🏭',
    description: 'Chapas de metal enferrujado, tubulações de vapor e contêineres blindados. Tonéis inflamáveis causam explosões em cadeia.',
    descriptionEn: 'Rusted steel plates, high-pressure steam pipes, and heavy cargo containers. Volatile fuel drums trigger explosive chain reactions.',
    obstacles: [
      // Central Smelting Pit Obstacle
      { x: 1100, y: 1100, w: 300, h: 300, type: 'smelting_furnace', name: 'Blast Furnace #01', color: '#27170a', borderColor: '#f59e0b' },
      // Industrial Cargo Containers (heavy cover)
      { x: 600, y: 700, w: 260, h: 100, type: 'container', name: 'Cargo Bay A', color: '#451a03', borderColor: '#ea580c' },
      { x: 1640, y: 700, w: 260, h: 100, type: 'container', name: 'Cargo Bay B', color: '#451a03', borderColor: '#ea580c' },
      { x: 600, y: 1700, w: 260, h: 100, type: 'container', name: 'Cargo Bay C', color: '#451a03', borderColor: '#ea580c' },
      { x: 1640, y: 1700, w: 260, h: 100, type: 'container', name: 'Cargo Bay D', color: '#451a03', borderColor: '#ea580c' },
      // Steam Pipeline Barriers
      { x: 950, y: 500, w: 600, h: 60, type: 'pipes', name: 'Main Steam Pipe N', color: '#1c1917', borderColor: '#78716c' },
      { x: 950, y: 1940, w: 600, h: 60, type: 'pipes', name: 'Main Steam Pipe S', color: '#1c1917', borderColor: '#78716c' },
      { x: 400, y: 1100, w: 80, h: 300, type: 'pipes', name: 'Coolant Pipe W', color: '#1c1917', borderColor: '#78716c' },
      { x: 2020, y: 1100, w: 80, h: 300, type: 'pipes', name: 'Coolant Pipe E', color: '#1c1917', borderColor: '#78716c' }
    ],
    destructibleCovers: [
      // Highly Explosive Chemical / Fuel Barrels
      { x: 1020, y: 1020, w: 45, h: 45, hp: 40, maxHp: 40, type: 'explosive_barrel', color: '#ef4444', explosive: true },
      { x: 1435, y: 1020, w: 45, h: 45, hp: 40, maxHp: 40, type: 'explosive_barrel', color: '#ef4444', explosive: true },
      { x: 1020, y: 1435, w: 45, h: 45, hp: 40, maxHp: 40, type: 'explosive_barrel', color: '#ef4444', explosive: true },
      { x: 1435, y: 1435, w: 45, h: 45, hp: 40, maxHp: 40, type: 'explosive_barrel', color: '#ef4444', explosive: true },
      { x: 750, y: 1220, w: 55, h: 55, hp: 70, maxHp: 70, type: 'scrap_pile', color: '#d97706' },
      { x: 1700, y: 1220, w: 55, h: 55, hp: 70, maxHp: 70, type: 'scrap_pile', color: '#d97706' }
    ]
  }
];

export function getMapById(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}
