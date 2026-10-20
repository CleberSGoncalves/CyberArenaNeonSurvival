# ⚡ Cyber Arena: Neon Survival

> **Título Comercial**: Cyber Arena: Neon Survival  
> **Gênero**: Battle Royale 2D Cyberpunk  
> **Plataforma**: CrazyGames HTML5 / WebGL (Homologação Total)  
> **URL Pública de Entrega**: https://cyberarenaneonsurvival.kinomuse.com.br  
> **Desenvolvedor**: FluidCleb Interactive  

---

## 🎮 Lore & Ambientação
Em uma mega-cidade dominada por corporações implacáveis (Neo-Kyoto), os hackers rejeitados competem em uma arena digital letal onde apenas o último sobrevivente ganha liberdade total.

## 🔁 Core Gameplay Loop
1. **Queda Tática (Grid Insertion)**: Inserção tática com posicionamento estratégico na Arena.
2. **Coleta Rápida (Data-Caches)**: Saqueie caixas de suprimentos espalhadas pelo cenário (Rifles de Plasma, Escopetas de Pulso, Canhões de Trilho EMP, Katanas de Feixe e Baterias de Nanites).
3. **Combate Tático & Esquiva**: Enfrente bots rivais e drones enforcers enquanto a zona de firewall venenosa contrai o mapa progressivamente.
4. **#1 Lone Champion (Vitória Suprema)**: Elimine todos os adversários ou sobreviva até o fim para garantir a liberdade, desbloquear novos setores e acumular créditos cibernéticos.

---

## 🌟 Módulos e Features Homologados

- **Arquitetura 3-Row Flex Column**: FAIXA 1 (HUD Topo), FAIXA 2 (Canvas Fullscreen 100vw x 100dvh via ResizeObserver & devicePixelRatio), FAIXA 3 (Rodapé Tático e link Kinomuse).
- **Sistema de 1★, 2★ e 3★ com Conclusão Imediata**: Barra visual de progresso com marcos acendíveis. Ao atingir ★ 1 Estrela, o botão verde pulsante `✅ CONCLUIR FASE (★) ➔` é liberado imediatamente.
- **Intro FluidCleb Interactive (0.0s a 2.8s)**: Orbes cósmicos, fusão central, gota metálica e logo neon com áudio sintético procedural suave + Lore Interativa com botão "Pular História" em 1 clique.
- **CrazyGames SDK v3 com Watchdog de 2.5s**: Resiliente contra AdBlock e domínios de desenvolvimento. Rewarded Ads (Reviver 1x com 3s de invulnerabilidade e Dobrar Créditos), Midgame Ads em telas de vitória/derrota (cooldown 180s).
- **Máquina de Estados de Modais Anti-Softlock**: `ModalController` centralizado com pilha que nunca congela o loop de física.
- **Game Juice & Feel Avançado**: Screen Shake Trauma², Hit-Stop de impacto crítico (40ms-70ms), Squash & Stretch elástico, feedback háptico e partículas procedurais ricas.
- **Meta-Game e Retenção Completa**:
  * 16 Setores Progressivos artesanais
  * Calendário de Login Diário de 7 Dias
  * Missões Diárias e Semanais (Quests) com multiplicador 2x de anúncio
  * Mercado Negro Cibernético (Upgrades e Visuais)
  * Roleta da Sorte Neural (Lucky Spin 12h)
- **Áudio Sintetizado Procedural (Web Audio API)**: Zero dependência de arquivos externos; áudio cyberpunk binaural imersivo com silenciamento automático ao minimizar aba.

---

## ⌨️ Controles
- **WASD / Setas**: Movimentação fluida
- **Mouse**: Mira direcional & Botão Esquerdo para disparar
- **Espaço / Shift**: Cyber Dash (desvio com invulnerabilidade e rastro neon)
- **Q**: Usar Bateria de Escudo / Kit Médico
- **E / F / Colisão**: Abrir caixa de suprimentos
- **Mobile**: Joystick virtual analógico + Botões de Ação na tela (Dash, Disparo, Cura)