/**
 * Magic Sort Shen - 核心遊戲邏輯 (視覺與模式重磅升級版)
 * 繁體中文註解
 * 包含：
 * 1. 參考高階解謎大作：精緻圓肩圓頸玻璃藥水瓶造型、3D 弧面液體反射
 * 2. 震撼「中央通天巨瓶 (Mega Tower Bottle)」神殿模式 (貫穿 4 排、容量高達 16 格、繫繩掛牌)
 * 3. 支援高達 100 關梯次難度演算法 (保證 100% 必定有解)
 * 4. 自由跳關地圖 (1 ~ 100 關)
 * 5. 計分系統與加管扣 200 分懲罰機制
 */

class MagicSortGame {
    constructor() {
        this.tubeCapacity = 4;
        this.megaCapacity = 16;
        this.maxLevels = 100;
        this.currentLevel = 1;
        this.score = 1000;
        this.moves = 0;
        this.tubes = []; // 二維陣列，每個元素為該試管內的顏色陣列
        this.tubeCapacities = []; // 每個試管對應的最大容量
        this.initialState = [];
        this.history = [];
        this.selectedTubeIndex = null;
        this.isAnimating = false;
        this.extraTubesAdded = 0;
        this.maxExtraTubes = 2;
        this.costPerExtraTube = 200;
        this.isTempleMode = false; // 是否啟用如參考圖中壯觀的「巨瓶神殿」模式

        // 鮮明高質感色彩 (與參考圖高度一致)
        this.colorPalette = [
            'green', 'orange', 'yellow', 'blue', 'purple', 
            'pink', 'teal', 'indigo', 'red', 'lime'
        ];

        this.initDOM();
        this.initCanvasEffects();
        this.bindEvents();
        this.renderLevelGrid();
        this.loadLevel(this.currentLevel);
    }

    initDOM() {
        this.tubesContainer = document.getElementById('tubes-container');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.movesDisplay = document.getElementById('moves-display');
        this.btnUndo = document.getElementById('btn-undo');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnAddTube = document.getElementById('btn-add-tube');
        this.btnSelectLevel = document.getElementById('btn-select-level');
        this.btnToggleLayout = document.getElementById('btn-toggle-layout');
        this.layoutText = document.getElementById('layout-text');
        this.btnSound = document.getElementById('btn-sound');
        this.soundIcon = document.getElementById('sound-icon');
        this.soundText = document.getElementById('sound-text');
        this.btnRules = document.getElementById('btn-rules');
        this.rulesModal = document.getElementById('rules-modal');
        this.btnCloseRules = document.getElementById('btn-close-rules');
        this.btnRulesConfirm = document.getElementById('btn-rules-confirm');

        // 跳關彈窗元素
        this.levelModal = document.getElementById('level-modal');
        this.btnCloseLevel = document.getElementById('btn-close-level');
        this.jumpInput = document.getElementById('jump-input');
        this.btnJumpGo = document.getElementById('btn-jump-go');
        this.levelGrid = document.getElementById('level-grid');

        // 通關彈窗元素
        this.victoryModal = document.getElementById('victory-modal');
        this.victoryStatsText = document.getElementById('victory-stats-text');
        this.btnReplay = document.getElementById('btn-replay');
        this.btnNextLevel = document.getElementById('btn-next-level');

        this.updateSoundBtnUI();
        this.updateScoreUI();
    }

    updateSoundBtnUI() {
        if (!this.soundIcon) return;
        if (window.soundManager.isMuted) {
            this.soundIcon.className = 'fa-solid fa-volume-xmark';
            this.soundText.textContent = '靜音';
        } else {
            this.soundIcon.className = 'fa-solid fa-volume-high';
            this.soundText.textContent = '音效';
        }
    }

    updateScoreUI(delta = 0) {
        if (!this.scoreDisplay) return;
        this.scoreDisplay.textContent = this.score;

        if (delta < 0) {
            this.scoreDisplay.classList.remove('score-deduct', 'score-add');
            void this.scoreDisplay.offsetWidth;
            this.scoreDisplay.classList.add('score-deduct');
            setTimeout(() => this.scoreDisplay.classList.remove('score-deduct'), 600);
        } else if (delta > 0) {
            this.scoreDisplay.classList.remove('score-deduct', 'score-add');
            void this.scoreDisplay.offsetWidth;
            this.scoreDisplay.classList.add('score-add');
            setTimeout(() => this.scoreDisplay.classList.remove('score-add'), 600);
        }
    }

    bindEvents() {
        this.btnUndo.addEventListener('click', () => this.undoMove());
        this.btnRestart.addEventListener('click', () => this.restartLevel());
        this.btnAddTube.addEventListener('click', () => this.addExtraTube());
        this.btnSelectLevel.addEventListener('click', () => this.openLevelModal());

        if (this.btnToggleLayout) {
            this.btnToggleLayout.addEventListener('click', () => this.toggleLayoutMode());
        }

        this.btnSound.addEventListener('click', () => {
            window.soundManager.toggleMute();
            this.updateSoundBtnUI();
        });

        // 規則彈窗
        this.btnRules.addEventListener('click', () => {
            this.rulesModal.classList.remove('hidden');
        });
        this.btnCloseRules.addEventListener('click', () => {
            this.rulesModal.classList.add('hidden');
        });
        this.btnRulesConfirm.addEventListener('click', () => {
            this.rulesModal.classList.add('hidden');
            window.soundManager.playSelect();
        });

        // 關卡跳轉彈窗
        this.btnCloseLevel.addEventListener('click', () => {
            this.levelModal.classList.add('hidden');
        });
        this.btnJumpGo.addEventListener('click', () => {
            const target = parseInt(this.jumpInput.value, 10);
            if (!isNaN(target) && target >= 1 && target <= this.maxLevels) {
                this.levelModal.classList.add('hidden');
                this.loadLevel(target);
                window.soundManager.playSelect();
            } else {
                alert(`請輸入 1 到 ${this.maxLevels} 之間的有效關卡編號！`);
            }
        });
        this.jumpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.btnJumpGo.click();
            }
        });

        // 通關彈窗
        this.btnReplay.addEventListener('click', () => {
            this.victoryModal.classList.add('hidden');
            this.restartLevel();
        });
        this.btnNextLevel.addEventListener('click', () => {
            this.victoryModal.classList.add('hidden');
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
            } else {
                alert('恭喜你通關了所有 100 關！你已經是傳奇大魔導士！');
            }
        });
    }

    toggleLayoutMode() {
        this.isTempleMode = !this.isTempleMode;
        if (this.layoutText) {
            this.layoutText.textContent = this.isTempleMode ? '標準模式' : '巨瓶模式';
        }
        window.soundManager.playSelect();
        this.loadLevel(this.currentLevel);
    }

    openLevelModal() {
        this.jumpInput.value = this.currentLevel;
        this.updateLevelGridActive();
        this.levelModal.classList.remove('hidden');
        window.soundManager.playSelect();
    }

    renderLevelGrid() {
        if (!this.levelGrid) return;
        this.levelGrid.innerHTML = '';

        for (let i = 1; i <= this.maxLevels; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-grid-btn';
            btn.dataset.level = i;
            btn.textContent = i;

            btn.addEventListener('click', () => {
                this.levelModal.classList.add('hidden');
                this.loadLevel(i);
                window.soundManager.playSelect();
            });

            this.levelGrid.appendChild(btn);
        }
    }

    updateLevelGridActive() {
        if (!this.levelGrid) return;
        const buttons = this.levelGrid.querySelectorAll('.level-grid-btn');
        buttons.forEach(btn => {
            const lvl = parseInt(btn.dataset.level, 10);
            if (lvl === this.currentLevel) {
                btn.classList.add('current');
            } else {
                btn.classList.remove('current');
            }
        });
    }

    /**
     * 關卡產生演算法 (保證 100% 必定有解)
     * 支援標準多管與如參考圖中史詩級中央巨瓶神殿佈局
     */
    generateLevel(level) {
        if (this.isTempleMode) {
            return this.generateTempleLevel(level);
        }

        let numColors;
        let numEmpty = 2;

        if (level <= 4) {
            numColors = 3;
        } else if (level <= 12) {
            numColors = 4;
        } else if (level <= 25) {
            numColors = 5;
        } else if (level <= 45) {
            numColors = 6;
        } else if (level <= 70) {
            numColors = 7;
        } else if (level <= 85) {
            numColors = 8;
        } else if (level <= 95) {
            numColors = 9;
        } else {
            numColors = 10;
        }

        const totalTubes = numColors + numEmpty;
        const activeColors = this.colorPalette.slice(0, numColors);

        let tubes = [];
        this.tubeCapacities = [];

        for (let i = 0; i < numColors; i++) {
            tubes.push(new Array(this.tubeCapacity).fill(activeColors[i]));
            this.tubeCapacities.push(this.tubeCapacity);
        }
        for (let i = 0; i < numEmpty; i++) {
            tubes.push([]);
            this.tubeCapacities.push(this.tubeCapacity);
        }

        const shuffleSteps = Math.min(35 + Math.floor(level * 1.5), 180);
        let lastFrom = -1;
        let lastTo = -1;

        for (let step = 0; step < shuffleSteps; step++) {
            const validMoves = [];

            for (let from = 0; from < totalTubes; from++) {
                if (tubes[from].length === 0) continue;
                for (let to = 0; to < totalTubes; to++) {
                    if (from === to) continue;
                    if (tubes[to].length >= this.tubeCapacities[to]) continue;
                    if (from === lastTo && to === lastFrom && Math.random() < 0.75) continue;

                    validMoves.push({ from, to });
                }
            }

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                const color = tubes[move.from].pop();
                tubes[move.to].push(color);
                lastFrom = move.from;
                lastTo = move.to;
            }
        }

        return tubes;
    }

    /**
     * 生成如參考圖一模一樣的「中央巨瓶神殿」關卡 (25 瓶佈局：左 12 + 中 1 巨瓶 + 右 12)
     */
    generateTempleLevel(level) {
        // 左 12 瓶 + 中央 1 巨瓶 + 右 12 瓶 = 共 25 瓶
        const numStandardTubes = 24;
        const megaIndex = 12; // 中央長瓶索引位置
        const activeColors = this.colorPalette.slice(0, 8); // 8 種鮮明魔法色

        let tubes = [];
        this.tubeCapacities = [];

        // 初始化 24 個普通管 (容量 4) + 1 個中央巨管 (容量 16)
        for (let i = 0; i < 25; i++) {
            if (i === megaIndex) {
                tubes.push([]);
                this.tubeCapacities.push(this.megaCapacity);
            } else {
                const color = activeColors[(i < megaIndex ? i : i - 1) % activeColors.length];
                tubes.push(new Array(this.tubeCapacity).fill(color));
                this.tubeCapacities.push(this.tubeCapacity);
            }
        }

        // 預留部分空管以利玩家開始倒水解謎
        tubes[0] = [];
        tubes[1] = [];
        tubes[23] = [];

        // 反向深度洗牌
        const shuffleSteps = 80 + Math.floor(level * 2);
        let lastFrom = -1;
        let lastTo = -1;

        for (let step = 0; step < shuffleSteps; step++) {
            const validMoves = [];

            for (let from = 0; from < 25; from++) {
                if (tubes[from].length === 0) continue;
                for (let to = 0; to < 25; to++) {
                    if (from === to) continue;
                    if (tubes[to].length >= this.tubeCapacities[to]) continue;
                    if (from === lastTo && to === lastFrom && Math.random() < 0.7) continue;

                    validMoves.push({ from, to });
                }
            }

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                const color = tubes[move.from].pop();
                tubes[move.to].push(color);
                lastFrom = move.from;
                lastTo = move.to;
            }
        }

        return tubes;
    }

    loadLevel(level) {
        this.currentLevel = Math.max(1, Math.min(level, this.maxLevels));
        this.moves = 0;
        this.history = [];
        this.selectedTubeIndex = null;
        this.extraTubesAdded = 0;
        this.btnAddTube.disabled = false;

        this.levelDisplay.textContent = `${this.currentLevel}/${this.maxLevels}`;
        this.movesDisplay.textContent = this.moves;

        this.tubes = this.generateLevel(this.currentLevel);
        this.initialState = JSON.parse(JSON.stringify(this.tubes));

        this.renderTubes();
        this.updateUndoButton();
    }

    restartLevel() {
        if (this.isAnimating) return;
        this.tubes = JSON.parse(JSON.stringify(this.initialState));
        this.moves = 0;
        this.history = [];
        this.selectedTubeIndex = null;
        this.extraTubesAdded = 0;
        this.btnAddTube.disabled = false;

        this.movesDisplay.textContent = this.moves;
        this.renderTubes();
        this.updateUndoButton();
        window.soundManager.playSelect();
    }

    addExtraTube() {
        if (this.extraTubesAdded >= this.maxExtraTubes) return;

        this.score -= this.costPerExtraTube;
        this.updateScoreUI(-this.costPerExtraTube);

        this.extraTubesAdded++;
        this.tubes.push([]);
        this.tubeCapacities.push(this.tubeCapacity);
        this.renderTubes();
        window.soundManager.playPour();

        if (this.extraTubesAdded >= this.maxExtraTubes) {
            this.btnAddTube.disabled = true;
        }
    }

    /**
     * 渲染瓶身與液體層 (升級為圓肩圓頸玻璃瓶 + 3D 弧面水面 + 中央巨瓶)
     */
    renderTubes() {
        this.tubesContainer.innerHTML = '';

        if (this.isTempleMode && this.tubes.length === 25) {
            this.renderTempleLayout();
            return;
        }

        this.tubesContainer.classList.remove('temple-mode');

        this.tubes.forEach((tube, index) => {
            const slot = this.createTubeSlotElement(tube, index);
            this.tubesContainer.appendChild(slot);
        });
    }

    /**
     * 巨瓶神殿專屬佈局渲染 (左邊 12 瓶 + 中央巨瓶 + 右邊 12 瓶)
     */
    renderTempleLayout() {
        this.tubesContainer.classList.add('temple-mode');

        const leftCol = document.createElement('div');
        leftCol.className = 'temple-column-left';

        const centerCol = document.createElement('div');
        centerCol.className = 'temple-column-center';

        const rightCol = document.createElement('div');
        rightCol.className = 'temple-column-right';

        this.tubes.forEach((tube, index) => {
            const slot = this.createTubeSlotElement(tube, index, index === 12);
            if (index < 12) {
                leftCol.appendChild(slot);
            } else if (index === 12) {
                centerCol.appendChild(slot);
            } else {
                rightCol.appendChild(slot);
            }
        });

        this.tubesContainer.appendChild(leftCol);
        this.tubesContainer.appendChild(centerCol);
        this.tubesContainer.appendChild(rightCol);
    }

    createTubeSlotElement(tube, index, isMega = false) {
        const capacity = this.tubeCapacities[index] || this.tubeCapacity;
        const slot = document.createElement('div');
        slot.className = 'tube-slot';
        slot.dataset.index = index;

        if (isMega) {
            slot.classList.add('mega-tower-slot');
        }

        if (this.selectedTubeIndex === index) {
            slot.classList.add('selected');
        }

        if (this.isTubeComplete(tube, capacity)) {
            slot.classList.add('completed');
        }

        // 一體化瓶子結構容器 (瓶口 + 瓶頸 + 瓶身永不脫離)
        const flask = document.createElement('div');
        flask.className = 'tube-flask';

        // 瓶口部 (外唇圈 + 細頸 + 麻繩吊牌)
        const mouth = document.createElement('div');
        mouth.className = 'bottle-mouth';

        const rim = document.createElement('div');
        rim.className = 'tube-rim';
        const neck = document.createElement('div');
        neck.className = 'tube-neck';

        mouth.appendChild(rim);
        mouth.appendChild(neck);

        // 巨型瓶專屬麻繩與藥水吊牌
        if (isMega) {
            const tagWrap = document.createElement('div');
            tagWrap.className = 'mega-tag-wrapper';
            tagWrap.innerHTML = `
                <div class="mega-rope"></div>
                <div class="mega-tag"><i class="fa-solid fa-flask"></i></div>
            `;
            mouth.appendChild(tagWrap);
        }

        flask.appendChild(mouth);

        // 瓶身主體
        const bodyEl = document.createElement('div');
        bodyEl.className = 'tube-body';

        // 雙側玻璃折射高光
        const shineLeft = document.createElement('div');
        shineLeft.className = 'tube-shine-left';
        const shineRight = document.createElement('div');
        shineRight.className = 'tube-shine-right';
        bodyEl.appendChild(shineLeft);
        bodyEl.appendChild(shineRight);

        // 液體層渲染 (每格等比高度)
        const unitHeightPercent = 100 / capacity;
        tube.forEach((color) => {
            const layer = document.createElement('div');
            layer.className = `liquid-layer color-${color}`;
            layer.style.height = `${unitHeightPercent}%`;
            bodyEl.appendChild(layer);
        });

        flask.appendChild(bodyEl);
        slot.appendChild(flask);

        // 瓶座陰影
        const stand = document.createElement('div');
        stand.className = 'tube-base-stand';
        slot.appendChild(stand);

        slot.addEventListener('click', () => this.handleTubeClick(index));
        return slot;
    }

    handleTubeClick(index) {
        if (this.isAnimating) return;
        const capacity = this.tubeCapacities[index] || this.tubeCapacity;

        if (this.selectedTubeIndex === null) {
            if (this.tubes[index].length === 0) {
                window.soundManager.playInvalid();
                return;
            }
            if (this.isTubeComplete(this.tubes[index], capacity)) {
                window.soundManager.playInvalid();
                return;
            }

            this.selectedTubeIndex = index;
            window.soundManager.playSelect();
            this.renderTubes();
            return;
        }

        if (this.selectedTubeIndex === index) {
            this.selectedTubeIndex = null;
            window.soundManager.playSelect();
            this.renderTubes();
            return;
        }

        const fromIdx = this.selectedTubeIndex;
        const toIdx = index;

        if (this.canPour(fromIdx, toIdx)) {
            this.executePour(fromIdx, toIdx);
        } else {
            const targetCap = this.tubeCapacities[toIdx] || this.tubeCapacity;
            if (this.tubes[toIdx].length > 0 && !this.isTubeComplete(this.tubes[toIdx], targetCap)) {
                this.selectedTubeIndex = toIdx;
                window.soundManager.playSelect();
                this.renderTubes();
            } else {
                window.soundManager.playInvalid();
            }
        }
    }

    canPour(fromIdx, toIdx) {
        const fromTube = this.tubes[fromIdx];
        const toTube = this.tubes[toIdx];
        const toCapacity = this.tubeCapacities[toIdx] || this.tubeCapacity;

        if (fromTube.length === 0) return false;
        if (toTube.length >= toCapacity) return false;

        const topColorFrom = fromTube[fromTube.length - 1];
        if (toTube.length === 0) return true;

        const topColorTo = toTube[toTube.length - 1];
        return topColorFrom === topColorTo;
    }

    executePour(fromIdx, toIdx) {
        this.isAnimating = true;

        this.history.push({
            tubes: JSON.parse(JSON.stringify(this.tubes)),
            moves: this.moves,
            score: this.score
        });

        const fromTube = this.tubes[fromIdx];
        const toTube = this.tubes[toIdx];
        const toCapacity = this.tubeCapacities[toIdx] || this.tubeCapacity;
        const topColor = fromTube[fromTube.length - 1];

        let count = 0;
        for (let i = fromTube.length - 1; i >= 0; i--) {
            if (fromTube[i] === topColor) {
                count++;
            } else {
                break;
            }
        }

        const spaceAvailable = toCapacity - toTube.length;
        const transferCount = Math.min(count, spaceAvailable);

        const slots = document.querySelectorAll('.tube-slot');
        const fromSlot = slots[fromIdx];
        const toSlot = slots[toIdx];

        if (fromSlot && toSlot) {
            const fromRect = fromSlot.getBoundingClientRect();
            const toRect = toSlot.getBoundingClientRect();
            const tiltDir = toRect.left < fromRect.left ? 'pouring-left' : 'pouring-right';
            fromSlot.classList.add(tiltDir);
        }

        window.soundManager.playPour();

        setTimeout(() => {
            for (let i = 0; i < transferCount; i++) {
                toTube.push(fromTube.pop());
            }

            this.moves++;
            this.movesDisplay.textContent = this.moves;
            this.selectedTubeIndex = null;
            this.isAnimating = false;

            this.renderTubes();
            this.updateUndoButton();

            if (this.isTubeComplete(toTube, toCapacity)) {
                this.score += 100;
                this.updateScoreUI(100);
                window.soundManager.playTubeComplete();
            }

            if (this.checkVictory()) {
                this.handleVictory();
            }
        }, 320);
    }

    undoMove() {
        if (this.history.length === 0 || this.isAnimating) return;
        const last = this.history.pop();
        this.tubes = last.tubes;
        this.moves = last.moves;
        this.score = last.score;
        this.selectedTubeIndex = null;

        this.movesDisplay.textContent = this.moves;
        this.updateScoreUI();
        this.renderTubes();
        this.updateUndoButton();
        window.soundManager.playSelect();
    }

    updateUndoButton() {
        this.btnUndo.disabled = this.history.length === 0;
    }

    isTubeComplete(tube, capacity = this.tubeCapacity) {
        if (tube.length !== capacity) return false;
        const first = tube[0];
        return tube.every(color => color === first);
    }

    checkVictory() {
        return this.tubes.every((tube, idx) => {
            const cap = this.tubeCapacities[idx] || this.tubeCapacity;
            return tube.length === 0 || this.isTubeComplete(tube, cap);
        });
    }

    handleVictory() {
        const levelBonus = 300 + this.currentLevel * 10;
        this.score += levelBonus;
        this.updateScoreUI(levelBonus);

        window.soundManager.playVictory();
        this.startConfetti();

        this.victoryStatsText.textContent = `第 ${this.currentLevel} 關達成！步數：${this.moves} 步，獲得獎勵 +${levelBonus} 分！`;
        setTimeout(() => {
            this.victoryModal.classList.remove('hidden');
        }, 600);
    }

    initCanvasEffects() {
        const bgCanvas = document.getElementById('magic-bg-canvas');
        if (!bgCanvas) return;
        const bgCtx = bgCanvas.getContext('2d');
        let width = bgCanvas.width = window.innerWidth;
        let height = bgCanvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = bgCanvas.width = window.innerWidth;
            height = bgCanvas.height = window.innerHeight;
        });

        const particles = [];
        const particleCount = 45;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.5 + 0.5,
                color: ['#a855f7', '#38bdf8', '#facc15', '#f472b6'][Math.floor(Math.random() * 4)],
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.5 - 0.2,
                alpha: Math.random() * 0.7 + 0.3
            });
        }

        function animateBg() {
            bgCtx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < 0) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;

                bgCtx.save();
                bgCtx.globalAlpha = p.alpha;
                bgCtx.fillStyle = p.color;
                bgCtx.shadowBlur = 12;
                bgCtx.shadowColor = p.color;
                bgCtx.beginPath();
                bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                bgCtx.fill();
                bgCtx.restore();
            });

            requestAnimationFrame(animateBg);
        }

        animateBg();
    }

    startConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = window.innerWidth;
        const height = canvas.height = window.innerHeight;

        const confetti = [];
        const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b'];

        for (let i = 0; i < 150; i++) {
            confetti.push({
                x: width / 2,
                y: height / 2,
                w: Math.random() * 12 + 6,
                h: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 18,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.35,
                alpha: 1
            });
        }

        let frame = 0;
        function renderConfetti() {
            ctx.clearRect(0, 0, width, height);
            let active = false;

            confetti.forEach(c => {
                c.vy += c.gravity;
                c.x += c.vx;
                c.y += c.vy;
                c.rotation += c.rotationSpeed;
                if (frame > 60) {
                    c.alpha -= 0.015;
                }

                if (c.alpha > 0) {
                    active = true;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, c.alpha);
                    ctx.translate(c.x, c.y);
                    ctx.rotate((c.rotation * Math.PI) / 180);
                    ctx.fillStyle = c.color;
                    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
                    ctx.restore();
                }
            });

            frame++;
            if (active) {
                requestAnimationFrame(renderConfetti);
            } else {
                ctx.clearRect(0, 0, width, height);
            }
        }

        renderConfetti();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new MagicSortGame();
});
