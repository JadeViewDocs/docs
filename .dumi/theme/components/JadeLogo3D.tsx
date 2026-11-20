// 品牌 3D Logo：用 three.js 实时渲染 public/logo/logo.glb（替代静态 favicon.png <img>）。
//
// 设计约束：
//  · three（~600KB）绝不能进首屏 bundle —— 全部 three 代码走动态 import()，挂载后才拉取；
//    SSR/SSG 阶段只输出兜底 <img>，three 相关逻辑都在 useEffect 里（dumi 预渲染安全）。
//  · logo.glb 是 Draco 压缩的（extensionsRequired: KHR_draco_mesh_compression），GLTFLoader
//    必须配 DRACOLoader；解码器自托管在 /vendor/draco/（默认的 gstatic CDN 国内不可达）。
//  · GLB（1.2MB）与解析结果模块级缓存 —— 页面上多个实例（标题栏/汉堡菜单/页脚）只拉取解析一次，
//    各实例 clone 场景共享几何体/材质（只读渲染，互不影响）。
//  · 兜底优先：WebGL 不可用 / 加载失败 / 尚未加载完 → 一直显示原静态 <img>；
//    首帧渲染完成后 canvas 淡入、img 淡出（无闪烁）。
//  · 性能：rAF 循环仅在元素可见时运行（IntersectionObserver + 页面 visibility），
//    prefers-reduced-motion 时只渲染静态一帧；卸载时释放 renderer。
import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Mesh, PerspectiveCamera } from 'three';

// 试验开关：true = 程序化几何拼装吉祥物（球体/椭球 primitive，用户提供的方案，无需下载 GLB）；
// false = 加载 GLB 精模。两条路径共用光照/动画（节点名保持 头/细分/眼睛/嘴巴 约定）。
// 试验结论（截图对比过）：primitive 拼装出来是「大橙球+小点眼+穿模平面嘴」，尾巴整个被身体
// 挡住，远不及 GLB 精模（雕塑感火焰/大眼/建模嘴），故保持 false 走 GLB；代码留作试验开关。
const USE_PROCEDURAL = false;

// 程序化吉祥物：椭球身体 + 拉伸球尾巴 + 球眼/瞳孔 + 平面嘴。
// 相对用户原始坐标的修正：眼/嘴原值 z=0.1 在半径 1 的球体内部（不可见），外移到椭球表面；
// 瞳孔改挂在眼球组内（跟随眨眼一起压扁）；envMapIntensity 用光穹校准值（照抄 2.2/3.0 会过曝）。
const buildProcedural = (THREE: typeof import('three')) => {
  const g = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(1, 64, 64);
  bodyGeo.scale(1.0, 0.95, 1.15); // 椭球形状拉伸
  const tailGeo = new THREE.SphereGeometry(0.8, 64, 64);
  tailGeo.scale(1.0, 0.5, 2.0); // 拉伸成尾巴形状
  tailGeo.translate(0, -0.3, -0.6); // 向后移动
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xffb347,
    roughness: 0.18,
    metalness: 0.02,
    transmission: 0.05,
    thickness: 0.8,
    ior: 1.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.0,
  });
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xffb347,
    roughness: 0.12,
    metalness: 0.0,
    transmission: 0.22,
    thickness: 1.2,
    ior: 1.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    opacity: 0.98,
    transparent: true,
    envMapIntensity: 1.15,
  });
  const eyeWhiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xfffdf8,
    roughness: 0.28,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12,
  });
  const pupilMat = new THREE.MeshPhysicalMaterial({
    color: 0x241c1b,
    roughness: 0.0,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    envMapIntensity: 1.4,
  });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xf26b5e, roughness: 0.55 });

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = '头';
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.name = '细分';
  const eyeGeo = new THREE.SphereGeometry(0.12, 32, 32);
  const pupilGeo = new THREE.SphereGeometry(0.06, 32, 32);
  const mkEye = (x: number, idx: number) => {
    const eye = new THREE.Group();
    eye.name = `眼睛_${idx}`;
    eye.add(new THREE.Mesh(eyeGeo, eyeWhiteMat));
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.z = 0.08; // 瞳孔浮在眼球表面
    eye.add(pupil);
    eye.position.set(x, 0.05, 1.06);
    return eye;
  };
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), mouthMat);
  mouth.name = '嘴巴';
  mouth.position.set(0, -0.15, 1.12);
  g.add(body, tail, mkEye(-0.18, 0), mkEye(0.18, 1), mouth);
  return g;
};

// —— 模块级缓存：three 命名空间 + 解析后的模型模板 + 照明 HDR（多实例共享，只加载一次）——
let assetsPromise: Promise<{
  THREE: typeof import('three');
  template: import('three').Group;
  studio: import('three').DataTexture;
}> | null = null;

// 归一化：居中到原点，按「正面投影」半宽/半高取大者 = 1 缩放。
// 模型不旋转（正面常驻朝向相机 +Z），无需给旋转扫掠留余量，画面贴合最饱满。
const normalize = (THREE: typeof import('three'), root: import('three').Object3D) => {
  const template = new THREE.Group();
  template.add(root);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  box.translate(center.negate());
  const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x));
  const halfH = Math.max(Math.abs(box.min.y), Math.abs(box.max.y));
  template.scale.setScalar(1 / (Math.max(halfW, halfH) || 1));
  return template;
};

// 低分辨率 HDR 环境图，为圆润表面提供宽高光和暖色反射。
const createStudioMap = (THREE: typeof import('three')) => {
  const width = 128;
  const height = 64;
  const pixels = new Uint16Array(width * height * 4);
  const keyDirection = new THREE.Vector3(-0.48, 0.6, 0.75).normalize();
  const rimDirection = new THREE.Vector3(0.26, 0.92, -0.56).normalize();
  const direction = new THREE.Vector3();
  for (let row = 0; row < height; row++) {
    const latitude = ((row + 0.5) / height - 0.5) * Math.PI;
    const up = Math.sin(latitude);
    const horizontal = Math.cos(latitude);
    for (let col = 0; col < width; col++) {
      const longitude = ((col + 0.5) / width - 0.5) * 2 * Math.PI;
      direction.set(Math.cos(longitude) * horizontal, up, Math.sin(longitude) * horizontal);
      const softbox = 5.1 * Math.max(0, direction.dot(keyDirection)) ** 15;
      const rim = 2.5 * Math.max(0, direction.dot(rimDirection)) ** 20;
      const floor = 0.2 * Math.max(0, -up);
      const offset = (row * width + col) * 4;
      pixels[offset] = THREE.DataUtils.toHalfFloat(0.28 + floor + softbox + rim);
      pixels[offset + 1] = THREE.DataUtils.toHalfFloat(0.27 + floor * 0.78 + softbox * 0.97 + rim * 0.91);
      pixels[offset + 2] = THREE.DataUtils.toHalfFloat(0.25 + floor * 0.56 + softbox * 0.87 + rim * 0.72);
      pixels[offset + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
};

const loadSubsurfaceBake = async (THREE: typeof import('three')) => {
  const loader = new THREE.TextureLoader();
  const [light, depth] = await Promise.allSettled([
    loader.loadAsync('/logo/subsurface-light.webp'),
    loader.loadAsync('/logo/subsurface-depth.png'),
  ]);
  if (light.status !== 'fulfilled' || depth.status !== 'fulfilled') {
    if (light.status === 'fulfilled') light.value.dispose();
    if (depth.status === 'fulfilled') depth.value.dispose();
    return;
  }
  light.value.colorSpace = THREE.SRGBColorSpace;
  depth.value.minFilter = THREE.LinearFilter;
  depth.value.magFilter = THREE.LinearFilter;
  depth.value.generateMipmaps = false;
  return { light: light.value, depth: depth.value };
};

// KeyShot 的正视图与 GLB 共用原始相机。把投影坐标存到网格上，模型摆动时光照仍贴在表面。
const attachBakeCoordinates = (
  THREE: typeof import('three'),
  mesh: Mesh,
  projector: PerspectiveCamera,
) => {
  const localToClip = new THREE.Matrix4()
    .multiplyMatrices(projector.projectionMatrix, projector.matrixWorldInverse)
    .multiply(mesh.matrixWorld);
  const position = mesh.geometry.getAttribute('position');
  const coordinates = new Float32Array(position.count * 3);
  const point = new THREE.Vector4();
  for (let i = 0; i < position.count; i++) {
    point.set(position.getX(i), position.getY(i), position.getZ(i), 1).applyMatrix4(localToClip);
    coordinates[i * 3] = (point.x + point.w) * 0.5;
    coordinates[i * 3 + 1] = (point.y + point.w) * 0.5;
    coordinates[i * 3 + 2] = point.w;
  }
  mesh.geometry.setAttribute('logoBakeCoordinate', new THREE.BufferAttribute(coordinates, 3));
};

const loadAssets = () => {
  assetsPromise ||= (async () => {
    const [THREE, { GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ]);
    const studio = createStudioMap(THREE);

    if (USE_PROCEDURAL) {
      return { THREE, template: normalize(THREE, buildProcedural(THREE)), studio };
    }

    const draco = new DRACOLoader().setDecoderPath('/vendor/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const [gltf, subsurface] = await Promise.all([
      loader.loadAsync('/logo/logo-v2.glb').finally(() => draco.dispose()),
      loadSubsurfaceBake(THREE),
    ]);
    const mascot = gltf.scene.getObjectByName('火人') ?? gltf.scene;
    const projector = gltf.cameras.find(
      (camera): camera is PerspectiveCamera =>
        camera.name === '正视图' && (camera as PerspectiveCamera).isPerspectiveCamera,
    );
    gltf.scene.updateMatrixWorld(true);

    const specOverride = new URLSearchParams(window.location.search).get('spec');
    // 投影未覆盖的表面沿用实时的暖色漫反射，整个模型继续实时计算高光。
    const resin = new THREE.MeshPhysicalMaterial({
      color: '#ff8209',
      roughness: 0.34,
      ior: 1.52,
      specularColor: new THREE.Color().setRGB(1, 0.856, 0.767),
      specularIntensity: specOverride === null ? 0.76 : Number.parseFloat(specOverride),
      clearcoat: 0.16,
      clearcoatRoughness: 0.34,
    });
    resin.onBeforeCompile = (shader) => {
      shader.uniforms.logoScatterColor = { value: new THREE.Color().setRGB(0.985, 0.793, 0.636) };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 logoScatterColor;')
        .replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
          vec3 keyDirection = normalize(mat3(viewMatrix) * vec3(-0.53, 0.69, 0.5));
          float lightFacing = dot(geometryNormal, keyDirection);
          float softFill = 1.0 - smoothstep(-0.9, 0.7, lightFacing);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * logoScatterColor * (0.04 + 0.14 * softFill);`,
        );
      if (!projector || !subsurface) return;

      shader.uniforms.logoBakedLight = { value: subsurface.light };
      shader.uniforms.logoBakedDepth = { value: subsurface.depth };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 logoBakeCoordinate;
          varying vec3 vLogoBakeCoordinate;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vLogoBakeCoordinate = logoBakeCoordinate;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vLogoBakeCoordinate;
          uniform sampler2D logoBakedLight;
          uniform sampler2D logoBakedDepth;`)
        .replace('#include <tonemapping_fragment>', `#include <tonemapping_fragment>
          vec2 bakedUv = vLogoBakeCoordinate.xy / vLogoBakeCoordinate.z;
          vec3 depthSample = texture2D(logoBakedDepth, bakedUv).rgb;
          // 深度用 RG 两通道编码，B 保存柔化的覆盖范围，收住遮挡边缘的颜色。
          float bakedDepth = dot(depthSample.rg, vec2(65280.0, 255.0)) * (16.0 / 65535.0);
          float depthDelta = abs(vLogoBakeCoordinate.z - bakedDepth);
          float coverage = depthSample.b * (1.0 - smoothstep(0.025, 0.09, depthDelta));
          vec3 bakedLight = texture2D(logoBakedLight, bakedUv).rgb;
          // 环境里的大柔光箱提供宽高光，直射光补亮核心，亮部用平滑曲线收住。
          vec3 liveGloss = 0.52 * reflectedLight.directSpecular + 2.0 * reflectedLight.indirectSpecular;
          #ifdef USE_CLEARCOAT
            liveGloss += material.clearcoat * (0.52 * clearcoatSpecularDirect + 2.0 * clearcoatSpecularIndirect);
          #endif
          float glossEnergy = dot(liveGloss, vec3(0.2126, 0.7152, 0.0722));
          float highlight = 1.0 - exp2(-2.8 * glossEnergy);
          vec3 diffuseAndGloss = mix(bakedLight, vec3(1.0, 0.96, 0.84), highlight);
          // 烘焙颜色已在 KeyShot 完成色调映射，混合后交给 Three.js 统一转到输出色域。
          gl_FragColor.rgb = mix(gl_FragColor.rgb, diffuseAndGloss, 0.94 * coverage);`);
    };
    mascot.traverse((object) => {
      const mesh = object as import('three').Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material) || !('specularIntensity' in mesh.material)) return;

      if (mesh.name.startsWith('眼睛')) {
        const material = (mesh.material as import('three').MeshPhysicalMaterial).clone();
        material.metalness = 0;
        material.roughnessMap = null;
        material.roughness = 0.27;
        material.specularIntensity = specOverride === null ? 0.42 : Number.parseFloat(specOverride);
        material.emissiveMap = material.map;
        material.emissive.set('#ffffff');
        material.emissiveIntensity = 0.055;
        mesh.material = material;
      } else if (mesh.name.startsWith('嘴巴')) {
        const material = (mesh.material as import('three').MeshPhysicalMaterial).clone();
        material.color.set('#391305');
        material.roughness = 0.46;
        material.specularIntensity = specOverride === null ? 0.15 : Number.parseFloat(specOverride);
        mesh.material = material;
      } else {
        if (subsurface && projector) attachBakeCoordinates(THREE, mesh, projector);
        mesh.material = resin;
      }
    });

    // 表情动画的枢轴修正：KeyShot 导出的网格节点无局部变换（顶点是绝对坐标），直接
    // scale 会绕世界原点挤压、部件飞走（踩过坑）。把几何居中、把中心位移搬到节点上，
    // 之后对节点的缩放/位移就在部件原地进行。模板级一次性处理，克隆实例共享。
    mascot.traverse((o: any) => {
      if (!o.isMesh || !(o.name.startsWith('眼睛') || o.name.startsWith('嘴巴'))) return;
      o.geometry.computeBoundingBox();
      const c = o.geometry.boundingBox.getCenter(new THREE.Vector3());
      o.geometry.translate(-c.x, -c.y, -c.z);
      o.position.copy(c);
    });
    return { THREE, template: normalize(THREE, mascot), studio };
  })();
  return assetsPromise;
};

/**
 * 3D 品牌 Logo（小火箭吉祥物）。size 为占位正方形边长(px)；fallback 为加载期间/失败时的静态图。
 * 动效（reduced-motion 下全部禁用，只渲染静态一帧）：
 *   · 整体上下飘浮 + 轻微左右摇晃（不自转，正脸常驻朝向观众）
 *   · 表情系统（12s 时间轴）：眨眼 / 瞟一眼 / 眯眼笑 / 惊讶；嘴巴平时静止（尾焰跟随整体）
 *   部件按 GLB 节点名匹配：头（球形主体）/ 眼睛_0、_1 / 嘴巴 / 细分（尾焰，位于 -Z 背侧）。
 * overscan：canvas 实际渲染尺寸 = size × overscan，居中溢出（不占布局）——
 *   3D 模型自带透视留白，等槽位渲染会显小，放大一圈才与原静态图标视觉等大。
 */
export default memo(function JadeLogo3D({
  size = 32,
  fallback = '/favicon-ca0d8df22450.png',
  fallbackRadius = 9,
  overscan = 1.35,
  alt = 'JadeView',
  style,
}: {
  size?: number;
  fallback?: string;
  fallbackRadius?: number;
  overscan?: number;
  alt?: string;
  style?: CSSProperties;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === 'undefined') return;

    let disposed = false;
    let renderer: import('three').WebGLRenderer | undefined;
    let pmrem: import('three').PMREMGenerator | undefined;
    let environment: import('three').WebGLRenderTarget | undefined;
    let keyShadow: import('three').DirectionalLightShadow | undefined;
    let io: IntersectionObserver | undefined;

    (async () => {
      try {
        const { THREE, template, studio } = await loadAssets();
        if (disposed) return;

        const px = Math.round(size * overscan);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // 超采样抗锯齿：画布只有几十 px，按 devicePixelRatio 渲染在 1x 屏上只有 48×48 物理像素，
        // MSAA 也救不回边缘。设 dpr×2 —— 相对设备物理像素恰好 2 倍超采样：浏览器的双线性缩小
        // 在「整 2 倍」时等价理想 box filter（每输出像素平均 2×2 输入）；非整数倍（如 3x→1x）
        // 反而会漏采样、残留锯齿（踩过坑）。画布 ≤ 200px² 级别，开销可忽略。
        renderer.setPixelRatio((window.devicePixelRatio || 1) * 2);
        renderer.setSize(px, px);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const q = new URLSearchParams(window.location.search);
        renderer.toneMapping = q.get('tm') === 'no' ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = Number.parseFloat(q.get('exp') ?? '1.04');

        const scene = new THREE.Scene();
        pmrem = new THREE.PMREMGenerator(renderer);
        environment = pmrem.fromEquirectangular(studio);
        scene.environment = environment.texture;
        scene.environmentIntensity = Number.parseFloat(q.get('envint') ?? '0.55');
        scene.environmentRotation.set(0, Number.parseFloat(q.get('envrot') ?? '0'), 0);

        const key = new THREE.DirectionalLight('#fff8e9', 2.9);
        key.position.set(-3.4, 4.5, 3.4);
        key.castShadow = true;
        keyShadow = key.shadow;
        key.shadow.intensity = 0.66;
        key.shadow.normalBias = 0.007;
        key.shadow.bias = -0.0002;
        key.shadow.radius = 3.5;
        key.shadow.mapSize.setScalar(size >= 96 ? 512 : 256);
        Object.assign(key.shadow.camera, { left: -1.65, right: 1.65, top: 1.65, bottom: -1.65, near: 0.5, far: 12 });
        key.shadow.camera.updateProjectionMatrix();
        const fill = new THREE.DirectionalLight('#fff4d5', 0.34);
        fill.position.set(3, 0.3, 2.2);
        scene.add(key, fill, new THREE.HemisphereLight('#fff5df', '#eead77', 0.4));

        // 共享几何体/材质的浅层级克隆（模型无骨骼/动画，clone 足够）。
        const model = template.clone(true);
        scene.add(model);

        // 按 GLB 节点名收集可动部件：只取 mesh（层级里同名分组会与 mesh 前缀重复，取分组会把
        // 缩放叠加多层——踩过坑），记录基准缩放/位置（动画做乘性/加性叠加，枢轴已在加载时修正）。
        // 尾焰/火焰/液滴不收集：与球面相交的网格做独立缩放会让相交轮廓抖动（踩过坑），只跟随整体。
        type Part = { node: import('three').Object3D; base: import('three').Vector3 };
        const eyes: Part[] = [];
        let mouth: Part | undefined;
        model.traverse((o: any) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.name.startsWith('眼睛')) eyes.push({ node: o, base: o.scale.clone() });
          else if (o.name.startsWith('嘴巴')) mouth = { node: o, base: o.scale.clone() };
        });
        const baseScale = model.scale.x;
        const modelShadow = new THREE.Matrix4();
        const worldToModel = new THREE.Matrix4();

        // fov 取 KeyShot 渲染相机的 15.2°（yfov 0.2651 rad，窄视角、透视平缓——参考图的观感）；
        // 归一化后正面投影半 extent = 1 恰好贴满 fov 一半，相机再退 1 防近端透视破框。
        const camera = new THREE.PerspectiveCamera(15.19, 1, 0.1, 100);
        camera.position.set(1.25, 0.45, 1 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + 1);
        camera.lookAt(0, 0, 0);

        const canvas = renderer.domElement;
        const bleed = -((overscan - 1) / 2) * size;
        Object.assign(canvas.style, {
          position: 'absolute',
          left: `${bleed}px`,
          top: `${bleed}px`,
          width: `${px}px`,
          height: `${px}px`,
          pointerEvents: 'none',
          opacity: '0',
          transition: 'opacity 0.35s ease',
        } satisfies Partial<CSSStyleDeclaration>);
        host.appendChild(canvas);

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let visible = true;
        let running = false;
        // 每实例随机相位：标题栏/页脚同屏时不完全同步，更像「各自活着」
        const phase = Math.random() * 10;

        const frame = (now: number) => {
          if (disposed || !visible) {
            running = false;
            return;
          }
          const t = now / 1000 + phase;

          // 整体：上下飘浮 + 轻微左右摇晃 + 呼吸微缩放。
          // 幅度受 canvas 画幅约束：模型已占画幅 ~80%，飘得太高会顶到画布边被切平（闪边）。
          model.position.y = 0.055 * Math.sin(t * 2.1);
          model.rotation.y = 0.05 * Math.sin(t * 1.35);
          model.rotation.z = 0.03 * Math.sin(t * 2.1 + 0.9);
          model.scale.setScalar(baseScale * (1 + 0.012 * Math.sin(t * 2.1 + 1.6)));

          // —— 表情（10s 时间轴循环，嘴巴平时静止不抖动）——
          // 只保留读感自然的两种：快速眨眼、眯眼笑（眼压成月牙+嘴微微变宽）。
          // ⚠️ 别加「瞟眼」（瞳孔烘死在贴图里，只能整个眼球在脸上滑动，非常诡异）和
          //    「惊讶张嘴」（嘴是条微笑弧线网格，竖向拉伸是变形不是张嘴）——都试过被否（踩过坑）。
          const pulse = (x: number, start: number, dur: number) => {
            const k = (x - start) / dur;
            if (k <= 0 || k >= 1) return 0;
            const w = k < 0.5 ? k * 2 : (1 - k) * 2;
            return w * w * (3 - 2 * w);
          };
          const cyc = t % 10;
          // 校准/调试用：?debug 时暴露时间轴位置（连拍脚本按 cyc 挑表情帧）
          if (q.has('debug')) (host as any).dataset.cyc = cyc.toFixed(2);
          const blink = Math.max(pulse(cyc, 2.4, 0.26), pulse(cyc, 5.3, 0.26), pulse(cyc, 9.2, 0.26));
          const happy = pulse(cyc, 6.6, 1.7); // 眯眼笑

          // 眼睛：竖向 = 眨眼 × 眯眼
          const eyeY = (1 - 0.85 * blink) * (1 - 0.6 * happy);
          const eyeX = 1 + 0.05 * happy;
          for (const e of eyes) e.node.scale.set(e.base.x * eyeX, e.base.y * eyeY, e.base.z);

          // 嘴巴：默认保持建模的微笑静止；眯眼笑时轻微变宽
          mouth?.node.scale.set(
            mouth.base.x * (1 + 0.22 * happy),
            mouth.base.y * (1 - 0.08 * happy),
            mouth.base.z,
          );

          // 将首帧阴影保存在模型空间，整体摆动时沿用同一张深度图。
          model.updateMatrixWorld();
          worldToModel.copy(model.matrixWorld).invert();
          key.shadow.matrix.multiplyMatrices(modelShadow, worldToModel);
          renderer!.render(scene, camera);
          requestAnimationFrame(frame);
        };
        const start = () => {
          if (running || disposed || reduceMotion) return;
          running = true;
          requestAnimationFrame(frame);
        };

        // 首帧：立即渲染一次（reduced-motion 下这就是最终画面），canvas 淡入、img（React 侧）淡出。
        // 淡入不能挂在 rAF 上（后台标签页 rAF 冻结 → 永远透明）：强制回流让 opacity:0 先落样式，
        // 再同步置 1，transition 照常播放。
        renderer.render(scene, camera);
        modelShadow.multiplyMatrices(key.shadow.matrix, model.matrixWorld);
        renderer.shadowMap.autoUpdate = false;
        canvas.getBoundingClientRect();
        canvas.style.opacity = '1';
        setReady(true);

        // 离屏（页脚不在视口/汉堡菜单收起）或标签页后台时停走，回来再继续。
        io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) start();
        });
        io.observe(host);
        start();
      } catch (e) {
        // WebGL 不可用 / 拉取失败：保持静态 img 兜底
        console.warn('[JadeLogo3D] fallback to static logo:', e);
      }
    })();

    return () => {
      disposed = true;
      io?.disconnect();
      keyShadow?.dispose();
      environment?.dispose();
      pmrem?.dispose();
      if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
      }
      // 几何体/材质属模块级共享模板，不随实例释放
    };
    // size/overscan 变化时必须整套重建：canvas 尺寸/溢出定位在挂载时按 size 定死，
    // 而 size 依赖 useResponsive()——SSR/水合先给桌面值(180)、随后翻成移动值(128)时若不重建，
    // 画布会卡在 180 的大尺寸、向下大幅溢出盖住标题（踩过坑：首页移动端 logo 压住 JadeView）。
    // 断点翻转很少见，重建开销（资源已模块级缓存，仅重克隆 + 新 renderer）可接受。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, overscan]);

  return (
    <span
      aria-label={alt}
      ref={hostRef}
      role="img"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      {ready && size >= 96 && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '5%',
            top: '98%',
            width: '81%',
            height: '15%',
            background: 'radial-gradient(ellipse at center, rgba(112, 48, 17, 0.28), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <img
        alt=""
        aria-hidden
        src={fallback}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          borderRadius: fallbackRadius,
          opacity: ready ? 0 : 1,
          transition: 'opacity 0.35s ease',
        }}
      />
    </span>
  );
});
