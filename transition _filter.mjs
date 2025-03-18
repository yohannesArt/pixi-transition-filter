import { app } from "/pixi_containers.mjs";
import { vertexShader } from "/transition_vertex.mjs";
import { fragmentShader } from "/transition_fragment.mjs";

class TransitionMesh {
  constructor(t1, t2, width, height) {
    this.q = app.renderer.resolution;
    // Store the logical dimensions
    this.width = width;
    this.height = height;

    // Pre-allocate arrays for geometry to avoid repeated allocations
    this._positionArray = new Float32Array(8);
    this._texCoordArray = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    this._indexArray = [0, 1, 2, 0, 2, 3];
    
    // Update position array
    this._updatePositionArray();

    // Create geometry once
    this.geometry = new PIXI.Geometry();
    this.geometry.addAttribute("aPosition", this._positionArray, 2);
    this.geometry.addAttribute("aTexCoord", this._texCoordArray, 2);
    this.geometry.addIndex(this._indexArray);

    // Cache uniform arrays to avoid creating new ones
    this._resolutionArray = [app.renderer.width, app.renderer.height];
    this._containerPosArray = [0, 0];
    this._containerScaleArray = [1.0, 1.0];
    this._meshResolutionArray = [this.width, this.height, 1, 1];

    // Create WebGL program
    const gl = PIXI.GlProgram.from({
      vertex: vertexShader,
      fragment: fragmentShader,
    });

    // Create shader
    this.shader = PIXI.Shader.from({
      glProgram: gl,
      resources: {
        uTextureFrom: t1.source,
        uTextureTo: t2.source,

        trUniforms: {
          uProgress: { value: 0.0, type: "f32" },
          uResolution: {
            value: this._resolutionArray,
            type: "vec2<f32>",
          },
          uContainerPosition: { value: this._containerPosArray, type: "vec2<f32>" },
          uContainerScale: { value: this._containerScaleArray, type: "vec2<f32>" },
          uDevicePixelRatio: { value: this.q, type: "f32" },
          gridDistance: { value: 0.0, type: "f32" },
          rgbShift: { value: 0.35, type: "f32" },
          time: { value: this.duration, type: "f32" },
          resolution: {
            value: this._meshResolutionArray,
            type: "vec4<f32>",
          },
          direction: { value: 0, type: "i32" },
          uRandomSeed: { value: 0.0, type: "f32" },
        },
      },
    });

    // Create mesh
    this.mesh = new PIXI.Mesh({
      geometry: this.geometry,
      shader: this.shader,
    });
    this.mesh.position.set(0, 0);
  }

  _updatePositionArray() {
    // Update the position array with current dimensions
    this._positionArray[0] = 0;
    this._positionArray[1] = 0;
    this._positionArray[2] = this.width;
    this._positionArray[3] = 0;
    this._positionArray[4] = this.width;
    this._positionArray[5] = this.height;
    this._positionArray[6] = 0;
    this._positionArray[7] = this.height;
  }

  setTexture(from, to) {
    this.mesh.shader.resources.uTextureFrom = from.source;
    this.mesh.shader.resources.uTextureTo = to.source;
    this.mesh.shader.resources.trUniforms.uniforms.uRandomSeed = Math.random().toFixed(1);
  }

  setDirection(val) {
    this.mesh.shader.resources.trUniforms.uniforms.direction = val;
  }

  getMesh() {
    return this.mesh;
  }

  set progress(value) {
    this.mesh.shader.resources.trUniforms.uniforms.uProgress = value;
  }

  get progress() {
    return this.mesh.shader.resources.trUniforms.uniforms.uProgress;
  }

  resize(width, height) {
    // Update dimensions
    this.width = width;
    this.height = height;
    
    // Update position array
    this._updatePositionArray();
    
    // Update the buffer directly instead of recreating geometry
    this.geometry.getBuffer('aPosition').update(this._positionArray);

    // Update resolution uniforms
    this._resolutionArray[0] = app.renderer.width;
    this._resolutionArray[1] = app.renderer.height;
    
    // Update mesh resolution
    this._meshResolutionArray[0] = this.width;
    this._meshResolutionArray[1] = this.height;

    // Update device pixel ratio if needed
    const newQ = app.renderer.resolution;
    if (this.q !== newQ) {
      this.q = newQ;
      this.mesh.shader.resources.trUniforms.uniforms.uDevicePixelRatio = this.q;
    }
  }

  updateContainerUniforms(container) {
    // Update container position array
    this._containerPosArray[0] = container.x;
    this._containerPosArray[1] = container.y;
    
    // Update container scale array
    this._containerScaleArray[0] = container.width / this.width;
    this._containerScaleArray[1] = container.height / this.height;

    // Update device pixel ratio only if it changed
    const newQ = app.renderer.resolution;
    if (this.q !== newQ) {
      this.q = newQ;
      this.mesh.shader.resources.trUniforms.uniforms.uDevicePixelRatio = this.q;
    }
  }
}

export { TransitionMesh };
