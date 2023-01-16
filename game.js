
async function _init() {
    let vSource = `
        attribute vec3 a_Position;
        attribute vec3 a_Color;

        varying vec3 v_Color;

        void main() {
            gl_Position = vec4(a_Position, 1.0);
            v_Color = a_Color;
        }
    `;

    let fSource = `
        precision lowp float;

        varying vec3 v_Color;

        varying vec3 v_Meme;

        void main() {
            gl_FragColor = vec4(v_Color, 1.0);
        }
    `;

    vars.testProgram = new ShaderProgram(vSource, fSource, {
        attributes: ["a_Position", "a_Color"],
    });

    let vertexData = new Float32Array([
        -1.0, -1.0, 0.0, 1.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
    ]);

    vars.vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vars.vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


let x = 0;
let y = 0;
let w = 2;
let h = 2;

async function _update() {
    /*
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    //Bind stuff
    

    gl.useProgram(vars.testProgram.program);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, vars.vbuffer);

    gl.vertexAttribPointer(vars.testProgram.locations["a_Position"], 3, gl.FLOAT, false, 6 * FSIZE, 0);
    gl.vertexAttribPointer(vars.testProgram.locations["a_Color"], 3, gl.FLOAT, false, 6 * FSIZE, 3 * FSIZE);

    gl.enableVertexAttribArray(vars.testProgram.locations["a_Position"]);
    gl.enableVertexAttribArray(vars.testProgram.locations["a_Color"]);

    //Draw
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //Unbind stuff
    gl.disableVertexAttribArray(vars.testProgram.locations["a_Position"]);
    gl.disableVertexAttribArray(vars.testProgram.locations["a_Color"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);


    if (buttons.key_A) {
        x -= 1;
    }
    if (buttons.key_D) {
        x += 1;
    }
    if (buttons.key_W) {
        y -= 1;
    }
    if (buttons.key_S) {
        y += 1;
    }
    if (buttons.key_ArrowUp) {
        h += 1;
    }
    if (buttons.key_ArrowDown) {
        h -= 1;
    }
    if (buttons.key_ArrowLeft) {
        w -= 1;
    }
    if (buttons.key_ArrowRight) {
        w += 1;
    }
    */

    cls([1, 1, 1]);

    //rectfill(1, 1, 1, 1, [1.0, 1.0, 0.0]);
    //rect(x, y, x + w, y + h, [0.0, 1.0, 1.0]);

    //rectfill(5, 5, 6, 6, [1.0, 0.0, 1.0]);
    //rect(4, 4, 6, 6, [0.0, 1.0, 1.0]);
    
    let color1 = [Math.random(), Math.random(), Math.random()];
    let color2 = color1.map((x) => 1 - x);

    for (let i = 0; i < 160; i++) {
        for (let j = 0; j < 144; j++) {
            let color = color1;
            if ((i + (j % 2)) % 2) {
                color = color2;
            }
            rectfill(i, j, i, j, color);
        }
    }


}
