// main.js
import { Database } from './data/db.js';

// --- UI 交互逻辑 ---
let selectedTraits = [];
const floatersContainer = document.getElementById('trait-floaters');
const infoPanel = document.getElementById('info-panel');
const surveyModal = document.getElementById('survey-modal');

function initUI() {
    // 渲染悬浮词条
    Database.traits.forEach((trait, index) => {
        const div = document.createElement('div');
        div.className = 'trait-item';
        div.innerText = trait;
        // 随机分布在屏幕上半部分
        div.style.left = (10 + Math.random() * 70) + '%';
        div.style.top = (10 + Math.random() * 40) + '%';
        div.style.animationDelay = (Math.random() * 2) + 's';
        
        div.addEventListener('click', () => {
            div.style.opacity = '0';
            div.style.pointerEvents = 'none';
            selectedTraits.push(trait.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '').trim()); // 提取汉字
            
            // 点击 2 个标签后触发调酒
            if(selectedTraits.length >= 2) {
                document.querySelectorAll('.trait-item').forEach(el => el.style.opacity = '0');
                mixCocktail();
            }
        });
        floatersContainer.appendChild(div);
    });

    // 绑定按钮事件
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
        surveyModal.classList.add('hidden');
        pourLiquid(newColor); // 直接改变液体颜色
        document.getElementById('tribute-content').innerText = "致敬你的独特选择：这杯专属于你的流体，蕴含着你当下的心境。";
        document.getElementById('drink-title').innerText = "自定义特调";
    });
}

function mixCocktail() {
    // 简单的匹配逻辑：随机选取一个或根据标签计算（这里暂用随机模拟）
    const match = Database.tributes[Math.floor(Math.random() * Database.tributes.length)];
    
    document.getElementById('drink-title').innerText = match.name + " 之影";
    document.getElementById('tribute-content').innerText = match.tribute;
    document.getElementById('ingredients-text').innerText = match.recipe;
    
    pourLiquid(match.color);
    
    setTimeout(() => {
        infoPanel.classList.remove('hidden');
    }, 1500); // 等待液体倒入动画
}

function resetGame() {
    selectedTraits = [];
    infoPanel.classList.add('hidden');
    floatersContainer.innerHTML = '';
    glassLiquid.scale.y = 0.001; // 清空杯子
    glassLiquid.position.y = -3.8;
    initUI();
}

// --- Three.js 3D 场景构建 ---
let scene, camera, renderer, glassLiquid;

function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 18);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 1. 创建玻璃杯 (高级材质)
    const glassGeometry = new THREE.CylinderGeometry(3.5, 2.5, 8, 32, 1, true);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,  // 玻璃透光
        opacity: 1,
        metalness: 0,
        roughness: 0.1,
        ior: 1.5,
        thickness: 0.5,
        side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    scene.add(glass);
    
    // 杯底封口
    const baseGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 32);
    const baseMaterial = glassMaterial.clone();
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -4;
    scene.add(base);

    // 2. 创建内部液体 (初始高度极低)
    const liquidGeometry = new THREE.CylinderGeometry(3.3, 2.4, 8, 32);
    // 将几何体原点移到底部，方便缩放
    liquidGeometry.translate(0, 4, 0); 
    
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x7e22ce,
        transmission: 0.6,
        roughness: 0.2,
        clearcoat: 1.0
    });
    glassLiquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    glassLiquid.position.y = -3.8;
    glassLiquid.scale.y = 0.001; // 接近 0
    scene.add(glassLiquid);

    // 3. 灯光布置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0x7e22ce, 2, 20);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);

    // 自适应窗口
    window.addEventListener('resize', onWindowResize, false);
    
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    // 让杯子极其轻微地旋转，增加质感
    scene.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
    renderer.render(scene, camera);
}

// 供外部调用的倒入液体动画
function pourLiquid(hexColor) {
    glassLiquid.material.color.set(hexColor);
    let targetScale = 0.8; // 装 80% 满
    
    function fill() {
        if (glassLiquid.scale.y < targetScale) {
            glassLiquid.scale.y += 0.015;
            requestAnimationFrame(fill);
        }
    }
    fill();
}

// 初始化启动
window.onload = () => {
    init3D();
    initUI();
};
