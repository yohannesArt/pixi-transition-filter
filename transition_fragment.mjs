// Фрагментен шейдър (Fragment shader)
const fragmentShader = `
   precision mediump float;
uniform float time;
uniform float width;
varying vec2 vTextureCoord;
uniform vec2 uResolution;
uniform sampler2D uTextureFrom;
uniform sampler2D uTextureTo;
uniform float uProgress;
varying vec2 vUv;
uniform int direction;
uniform float gridDistance;
uniform vec4 resolution;
uniform float rgbShift;
uniform float uRandomSeed;
   
// Optimized pseudo-random function (unchanged as it's already quite efficient)
float random(vec2 st) {
   return fract(sin(dot(st.xy + vec2(uRandomSeed), vec2(12.9898, 78.233))) * 43758.5453123);
}

// Optimized square pattern function
float squarePattern(vec2 uv, float progressValue) {
    // Correcting UV coordinates based on aspect ratio
    vec2 correctedUV = uv * vec2(resolution.x / resolution.y, 1.0);
    float scale = 10.0;
    
    // Calculate one pixel in normalized coordinates
    vec2 onePixel = 0.1 / resolution.xy;
    vec2 gapInGridSpace = onePixel * scale;
    
    // Scale the UV coordinates
    vec2 pos = correctedUV * scale;
    
    // Create grid
    vec2 grid = fract(pos);
    vec2 id = floor(pos);
    
    // Random value for each square - calculated only once
    float rand = random(id);
    
    // Create square with exactly 1-pixel spacing - combine into one step operation
    vec2 borders = step(gapInGridSpace, grid) * step(gapInGridSpace, 1.0 - grid);
    float square = borders.x * borders.y;
    
    // Animate square appearance - simplified
    return square * step(rand, progressValue + sin(time * 0.01 + rand * 6.28) * 0.01);
}

// Optimized parabola (kept same as original)
float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

void main() {
    // Calculate parabola once and reuse
    float parabolaProgress = parabola(uProgress, 1.0);
    
    // Calculate dynamic RGB shift once
    float dynamicShiftAmount = rgbShift * 0.01 * parabolaProgress;
    
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    vec2 shiftRight = vec2(dynamicShiftAmount, 0.0);
    
    // Fewer redundant calculations for texture coordinates
    vec2 fromR = newUV + shiftRight;
    vec2 fromB = newUV - shiftRight;
    vec2 toR = newUV - shiftRight;
    vec2 toB = newUV + shiftRight;
    
    // RGB components from first texture
    float r1 = texture2D(uTextureFrom, fromR).r;
    vec4 centerFrom = texture2D(uTextureFrom, newUV);
    float b1 = texture2D(uTextureFrom, fromB).b;
    
    // RGB components from second texture
    float r2 = texture2D(uTextureTo, toR).r;
    vec4 centerTo = texture2D(uTextureTo, newUV);
    float b2 = texture2D(uTextureTo, toB).b;
    
    // Create final colors with RGB shift
    vec4 color1 = vec4(r1, centerFrom.g, b1, 1.0);
    vec4 color2 = vec4(r2, centerTo.g, b2, 1.0);
    
    // Calculate square pattern - call function only once
    float pattern = squarePattern(newUV, uProgress);
    pattern = smoothstep(0.2, 0.2, pattern); // This is equivalent to step(0.2, pattern)
    
    // Optimize direction calculation
    float w = width * parabolaProgress;
    float transitionBase = mix(-w/2.0, 1.0 - w/2.0, uProgress);
    float transitionCoord = (direction == 1) ? vUv.x + transitionBase : (1.0 - vUv.x) + transitionBase;
    
    // Optimize final mask calculation
    float maskvalue = smoothstep(1.0 - w, 1.0, transitionCoord);
    float mask = maskvalue + maskvalue * pattern;
    
    // Simplify conditional logic using mix
    float border = 1.0;
    float final = uProgress >= 1.0 ? 1.0 : smoothstep(border, border + 0.01, mask);
    
    gl_FragColor = mix(color1, color2, final);
}
    `;
export { fragmentShader };