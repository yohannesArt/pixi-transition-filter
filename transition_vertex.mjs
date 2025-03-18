// Върхов шейдър (Vertex shader)
const vertexShader = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vUv; // Only keep one varying
uniform vec2 uResolution;
uniform vec2 uContainerPosition;
uniform vec2 uContainerScale;
uniform float uDevicePixelRatio;

void main() {
    // Combine position calculations
    vec2 position = ((aPosition * uContainerScale + uContainerPosition) * uDevicePixelRatio / uResolution) * 2.0 - 1.0;   
    // Flip Y axis (can't combine with above due to selector)
    position.y *= -1.0;   
    gl_Position = vec4(position, 0.0, 1.0); 
    // Only assign to one varying
    vUv = aTexCoord;
}
    `;

export { vertexShader };
