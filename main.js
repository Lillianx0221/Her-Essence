// main.js
import { Database } from './data/db.js';

let selectedTraits = [];
const floatersContainer = document.getElementById('trait-floaters');
const infoPanel = document.getElementById('info-panel');
const surveyModal = document.getElementById('survey-modal');

// --- 敏感词过滤器 ---
const BANNED_WORDS_REGEX = /血|杀|暴力|妓|娼|婊|荡妇|绿茶|贱/i;

function validateCustomInput(inputString) {
    if (BANNED_WORDS_REGEX.test(inputString)) {
        alert("调酒屋守则：本空间拒绝任何含有暴力、血腥或贬低性色彩的词汇。请重新输入。");
        return false;
    }
    return true;
}

function initUI() {
    Database.traits.forEach((trait) => {
        const div = document.createElement('div');
        div.className = 'trait-item';
        div.innerText = trait;
        div.style.left = (10 + Math.random() * 70) + '%';
        div.style.top = (10 + Math.random() * 70) + '%';
        div.style.animationDelay = (Math.random() * 2) + 's';
        
        div.addEventListener('click', () => {
            div.style.opacity = '0';
            div.style.pointerEvents = 'none';
            selectedTraits.push(trait.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '').trim());
            
            if(selectedTraits.length >= 2) {
                document.querySelectorAll('.trait-item').forEach(el => el.style.opacity = '0');
                mixCocktail();
            }
        });
        floatersContainer.appendChild(div);
    });

    document.getElementById('accept-btn').addEventListener('click', () => {
        alert("酒液已入喉，敬意存心中。");
        resetGame();
    });
    
    document.getElementById('reject-btn').addEventListener('click', () => {
        surveyModal.classList.remove('hidden');
    });
    
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        surveyModal.classList.add('hidden');
    });
    
    document.getElementById('recalculate-btn').addEventListener('click', () => {
        const newColor = document.getElementById('color-picker').value;
        const moodText = document.getElementById('mood-input').value;
        
        if (!validateCustomInput(moodText)) return; 

        surveyModal.classList.add('hidden');
        pourLiquid(newColor, 0.7); 
        
        document.getElementById('drink-title').innerText = "自定义特调";
        document.getElementById('tribute-content').innerText = "致敬你的独特选择：这杯专属于你的流体，蕴含着你当下的心境。";
        document.getElementById('ingredients-text').innerText = moodText || "未知心境";
        document.getElementById('label-wrapper').classList.add('hidden');
    });
}

function mixCocktail() {
    const match = Database.tributes[Math.floor(Math.random() * Database.tributes.length)];
    
    // 安全获取 DOM
    const titleEl = document.getElementById('drink-title');
    const tributeEl = document.getElementById('tribute-content');
    const ingredientsEl = document.getElementById('ingredients-text');
    const labelWrapper = document.getElementById('label-wrapper');
    const falseLabel = document.getElementById('false-label');
    const trueLabel = document.getElementById('true-label');
    
    if(titleEl) titleEl.innerText = match.name + " 之影";
    if(tributeEl) tributeEl.innerText = match.tribute;
    if(ingredientsEl) ingredientsEl.innerText = match.recipe;
    
    // 处理标签动画
    if (match.falseLabel && match.trueLabel && labelWrapper) {
        labelWrapper.classList.remove('hidden');
        falseLabel.innerText = match.falseLabel;
        trueLabel.innerText = match.trueLabel;
        falseLabel.classList.remove('dissolve');
        trueLabel.classList.remove('reveal');
    } else if (labelWrapper) {
        labelWrapper.classList.add('hidden');
    }
    
    pourLiquid(match.color, match.opacity || 0.8);
    
    if (match.effect === "silver_dust") createSilverDust();
    
    setTimeout(() => {
        if(infoPanel) infoPanel.classList.remove('hidden');
        // 触发撕下标签动画
        setTimeout(() => {
            if (match.falseLabel && falseLabel) {
                falseLabel.classList.add('dissolve');
                trueLabel.classList.add('reveal');
            }
        }, 1200);
    }, 1500);
}

function resetGame() {
    selectedTraits = [];
    infoPanel.classList.add('hidden');
    floatersContainer.innerHTML = '';
    glassLiquid.scale.y = 0.001; 
    glassLiquid.position.y = -3.8;
    if(particleSystem) scene.remove(particleSystem);
    initUI();
}

// --- Three.js 3D 场景 ---
let scene, camera, renderer, glassLiquid, particleSystem;

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 18);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 修复：使用 Phong 材质替代 Physical，呈现透明玻璃质感
    const glassGeometry = new THREE.CylinderGeometry(3.5, 2.5, 8, 32, 1, true);
    const glassMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        shininess: 100,
        side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    scene.add(glass);
    
    const baseGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 32);
    const base = new THREE.Mesh(baseGeometry, glassMaterial);
    base.position.y = -4;
    scene.add(base);

    // 内部液体
    const liquidGeometry = new THREE.CylinderGeometry(3.3, 2.4, 8, 32);
    liquidGeometry.translate(0, 4, 0); 
    
    const liquidMaterial = new THREE.MeshPhongMaterial({
        color: 0x7e22ce,
        transparent: true,
        opacity: 0.8,
        shininess: 50
    });
    glassLiquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    glassLiquid.position.y = -3.8;
    glassLiquid.scale.y = 0.001; 
    scene.add(glassLiquid);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
    if (particleSystem) {
        particleSystem.rotation.y += 0.002; // 让银粉缓缓旋转
    }
    renderer.render(scene, camera);
}

function pourLiquid(hexColor, targetOpacity) {
    glassLiquid.material.color.set(hexColor);
    glassLiquid.material.opacity = targetOpacity;
    
    let targetScale = 0.8; 
    function fill() {
        if (glassLiquid.scale.y < targetScale) {
            glassLiquid.scale.y += 0.015;
            requestAnimationFrame(fill);
        }
    }
    fill();
}

function createSilverDust() {
    if (particleSystem) scene.remove(particleSystem);
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const r = Math.random() * 2.0;
        const theta = Math.random() * 2 * Math.PI;
        positions[i * 3] = r * Math.cos(theta); 
        positions[i * 3 + 1] = Math.random() * 6 + 1; // 高度范围
        positions[i * 3 + 2] = r * Math.sin(theta); 
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMaterial = new THREE.PointsMaterial({ color: 0xC0C0C0, size: 0.1, transparent: true, opacity: 0.8 });
    particleSystem = new THREE.Points(particles, pMaterial);
    glassLiquid.add(particleSystem);
}

window.onload = () => {
    init3D();
    initUI();
};
