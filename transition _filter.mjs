class TransitionFilter extends PIXI.Filter {
  constructor(t1, t2, sprite) {
    const vertexShader = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform vec4 filterArea;
uniform vec2 spriteSize;
uniform vec2 spritePosition;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

void main(void) {
    gl_Position = filterVertexPosition();
    
    // Calculate correct texture coordinates based on sprite position and size
    // This maps the filter coordinates to proper texture coordinates
    vTextureCoord = aPosition;
}`;

    const fragmentShader = `
in vec2 vTextureCoord;
out vec4 finalColor;
precision mediump float;
uniform sampler2D uTextureFrom;
uniform sampler2D uTextureTo;
uniform float uProgress; // 0.0 to 1.0 transition value    

void main() {
    vec4 fromColor = texture2D(uTextureFrom, vTextureCoord);
    vec4 toColor = texture2D(uTextureTo, vTextureCoord);        
    // Simple linear blend between textures
    finalColor = mix(fromColor, toColor, uProgress);
}`;

    const gl = PIXI.GlProgram.from({
      vertex: vertexShader,
      fragment: fragmentShader,
      name: "tr-filter",
    });
    
    // Pass the uniforms to the super constructor
    super({
      glProgram: gl,
      resources: {
        uTextureFrom: t1.source,
        uTextureTo: t2.source,
        trUniforms: {
          uProgress: { value: 0.0, type: "f32" },
          filterArea: { value: [0, 0, 0, 0], type: "vec4<f32>" },
          spriteSize: { value: [sprite.width, sprite.height], type: "vec2<f32>" },
          spritePosition: { value: [sprite.x, sprite.y], type: "vec2<f32>" }
        },
      },
    });
    
    this.sprite = sprite;
    this.autoFit = true;
    this.padding = 0; // Disable padding to prevent stretching
  }

  apply(filterManager, input, output, clearMode, _currentState) {
    const targetSprite = this.sprite;    
    // Update sprite position and size uniforms
    this.resources.trUniforms.uniforms.filterArea = [
      targetSprite.x,
      targetSprite.y,
      targetSprite.width,
      targetSprite.height,
    ];
    
    this.resources.trUniforms.uniforms.spriteSize = [
      targetSprite.width,
      targetSprite.height
    ];
    
    this.resources.trUniforms.uniforms.spritePosition = [
      targetSprite.x,
      targetSprite.y
    ];
    
    // Call the parent apply method
    super.apply(filterManager, input, output, clearMode);
  }

  set progress(value) {
    this.resources.trUniforms.uniforms.uProgress = value;
  }

  get progress() {
    return this.resources.trUniforms.uniforms.uProgress;
  }
}
export { TransitionFilter };
