class TransitionFilter extends PIXI.Filter {
  constructor(t1, t2, sprite) {
    const vertexShader = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform vec4 filterArea; // Add this uniform for proper scaling

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    // Map the position to the texture
    // We're mapping from normalized coordinates to the sprite's texture coordinates
    vec2 coord = aPosition;
    
    // Account for the filterArea size and position
    return coord;
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = aPosition;
}`;

    // Fragment shader looks good
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
      }
    `;

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
        },
      },
    });
    // console.log(this);
    this.sprite = sprite;
    this.autoFit = false;
  }
  apply(filterManager, input, output, clearMode, _currentState) {
    // Set the filterArea uniform
   const targetSprite = this.sprite;
    this.resources.trUniforms.uniforms.filterArea = [
      targetSprite.x,
      targetSprite.y,
      targetSprite.width,
      targetSprite.height,
    ];
    // Call the parent apply method
    super.apply(filterManager, input, output, clearMode);
  }

  set progress(value) {
    this.resources.trUniforms.uniforms.uProgress = value;
  }

  get progress() {
    return this.uniforms.uProgress.value;
  }
}
export { TransitionFilter };
