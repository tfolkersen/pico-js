let vars = {
};

let system = {
    __cameraX: 0,
    __cameraY: 0,
    color: [1, 1, 1],
};

let displayOptions = {
    width: 160,
    height: 144,
    scale: 4,
    fps: 1,
};
let gl;

let __buttonList = [
    ["w", "key_W"],
    ["a", "key_A"],
    ["s", "key_S"],
    ["d", "key_D"],
    ["ArrowUp", "key_ArrowUp"],
    ["ArrowLeft", "key_ArrowLeft"],
    ["ArrowDown", "key_ArrowDown"],
    ["ArrowRight", "key_ArrowRight"],
    [" ", "key_Space"],
    ["Shift", "key_Shift"],
];

let buttons = {
    __map: {},
};

class ShaderProgram {
    constructor(vshaderSource, fshaderSource, options = {}) {
        this.program = gl.createProgram();
        this.vshader = gl.createShader(gl.VERTEX_SHADER);
        this.fshader = gl.createShader(gl.FRAGMENT_SHADER);
        this.locations = {};

        gl.shaderSource(this.vshader, vshaderSource);
        gl.shaderSource(this.fshader, fshaderSource);

        let success = true;

        gl.compileShader(this.vshader);
        if (!gl.getShaderParameter(this.vshader, gl.COMPILE_STATUS)) {
            success = false;
            console.log("Failed to compile vertex shader: " + gl.getShaderInfoLog(this.vshader));
        }

        gl.compileShader(this.fshader);
        if (!gl.getShaderParameter(this.fshader, gl.COMPILE_STATUS)) {
            success = false;
            console.log("Failed to compile fragment shader: " + gl.getShaderInfoLog(this.fshader));
        }

        gl.attachShader(this.program, this.vshader);
        gl.attachShader(this.program, this.fshader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            success = false;
            console.log("Failed to link shader program: " + gl.getProgramInfoLog(this.program));
        }

        if (!success) {
            this.cleanup();
        }

        if (options.attributes) {
            options.attributes.forEach((a) => {
                let loc = gl.getAttribLocation(this.program, a);
                if (loc === -1) {
                    console.log("Failed to find attribute: " + a);
                }
                this.locations[a] = loc;
            });
        }

        if (options.uniforms) {
            options.uniforms.forEach((u) => {
                let loc = gl.getUniformLocation(this.program, u);
                if (loc === null) {
                    console.log("Failed to find uniform: " + u);
                }
                this.locations[u] = loc;
            });
        }
    }

    cleanup() {
        if (this.vshader) {
            gl.deleteShader(this.vshader);
        }

        if (this.fshader) {
            gl.deleteShader(this.fshader);
        }

        if (this.program) {
            gl.deleteProgram(this.program);
        }
        this.vshader = undefined;
        this.fshader = undefined;
        this.program = undefined;
        this.locations = undefined;
    }
}

async function __drawFramebuffer() {
    //assume GL framebuffer is bound, draw current system framebuffer's contents
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    
    //Bind stuff
    gl.useProgram(system.framebufferProgram.program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);

    gl.bindBuffer(gl.ARRAY_BUFFER, system.framebufferVertexBuffer);

    gl.vertexAttribPointer(system.framebufferProgram.locations["a_Position"], 2, gl.FLOAT, false, 2 * FSIZE, 0);
    gl.enableVertexAttribArray(system.framebufferProgram.locations["a_Position"]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, system.framebufferColor);
    gl.uniform1i(system.framebufferProgram.locations["u_tex0"], 0);

    //Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    //Unbind stuff
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(system.framebufferProgram.locations["a_Position"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
}

async function __initSystem() {
    //Setup framebuffer jank
    system.framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, system.framebuffer);

    //Framebuffer color attachment
    system.framebufferColor = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, system.framebufferColor);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, displayOptions.width, displayOptions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, system.framebufferColor, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //Framebuffer depth attachment
    let framebufferDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, framebufferDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, displayOptions.width, displayOptions.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, framebufferDepth);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    //TODO stencil buffer later (???)

    console.log("Main framebuffer status: 0x" + gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(16));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //Square representing main framebuffer bounds
    let squareData = new Float32Array([
        1.0, 1.0, //9
        1.0, -1.0, //3
        -1.0, -1.0, //1

        -1.0, -1.0, //1
        -1.0, 1.0, //7
        1.0, 1.0, //9
    ]);

    system.framebufferVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, system.framebufferVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, squareData, gl.STATIC_DRAW, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //Shader program to draw system framebuffer to GL framebuffer
    let vshader1Source = `
        attribute vec2 a_Position;
    
        varying vec2 v_Position;

        void main() {
            gl_Position = vec4(a_Position, 0.0, 1.0);
            v_Position = a_Position;
        }
    `;

    let fshader1Source = `
        #define WIDTH ${displayOptions.width}.0
        #define HEIGHT ${displayOptions.height}.0

        precision lowp float;

        uniform sampler2D u_tex0;

        varying vec2 v_Position;


        void main() {
            float x = v_Position.x;
            float y = v_Position.y;

            // (-1, 1) --> (0, 1)
            x = (x + 1.0) / 2.0;
            y = (y + 1.0) / 2.0;

            x = floor(x * WIDTH) / WIDTH;
            y = floor(y * HEIGHT) / HEIGHT;

            vec4 color = texture2D(u_tex0, vec2(x, y));
            gl_FragColor = color;
        }
    `;

    system.framebufferProgram = new ShaderProgram(vshader1Source, fshader1Source, {
        attributes: ["a_Position"],
        uniforms: ["u_tex0"],
    });

    __initDrawPrograms();
}


async function __gameLoop() {
    const t0 = performance.now();

    //Bind system framebuffer at start of new tick
    gl.bindFramebuffer(gl.FRAMEBUFFER, system.framebuffer);
    gl.viewport(0, 0, displayOptions.width, displayOptions.height);

    if (typeof _update === "function") {
        await _update();
    }

    if (typeof _draw === "_draw") {
        await _draw();
    }

    //Unbind system framebuffer, draw it to GL framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, displayOptions.width * displayOptions.scale, displayOptions.height * displayOptions.scale);
    await __drawFramebuffer();

    const t1 = performance.now();
    const tdelta = t1 - t0;
    console.log(tdelta);
    setTimeout(__gameLoop, (1000 / displayOptions.fps) - tdelta);
}

async function main() {
    system.canvas = document.createElement("canvas");

    system.canvas.width = displayOptions.width * displayOptions.scale;
    system.canvas.height = displayOptions.height * displayOptions.scale;
    system.canvas.style.backgroundColor = "#000000";
    system.canvas.style.imageRendering = "crisp-edges";

    document.body.appendChild(system.canvas);

    gl = system.canvas.getContext("webgl2");

    __buttonList.forEach((button) => {
        buttons[button[1]] = false;
        buttons.__map[button[0]] = button[1];
    });

    document.addEventListener("keydown", (event) => {
        let keyName = buttons.__map[event.key];
        if (!keyName) {
            keyName = buttons.__map[event.key.toLowerCase()];
        }
        if (keyName) {
            buttons[keyName] = true;
        }
    });

    document.addEventListener("keyup", (event) => {
        let keyName = buttons.__map[event.key];
        if (!keyName) {
            keyName = buttons.__map[event.key.toLowerCase()];
        }
        if (keyName) {
            buttons[keyName] = false;
        }
    });

    await __initSystem();

    if (typeof _init === "function") {
        await _init();
    }

    await __gameLoop();
}

document.addEventListener("DOMContentLoaded", main);
