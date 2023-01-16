
async function __initDrawPrograms() {
    //Draw rect
    {

        let vertexData = new Float32Array([
            0, 1, 2,
            2, 3, 0,
        ]);

        let vshader1Source = `#version 300 es
            #define WIDTH ${displayOptions.width}.0
            #define HEIGHT ${displayOptions.height}.0
            in float a_Index;

            uniform vec4 u_Rect;
            uniform vec2 u_Camera;

            out vec2 v_IntPosition;
            out vec4 v_Rect;

            void main() {
                v_Rect = u_Rect;

                vec2 position = vec2(0.0, 0.0);

                if (a_Index == 0.0) {
                    position = vec2(u_Rect.x, u_Rect.y);
                } else if (a_Index == 1.0) {
                    position = vec2(u_Rect.z, u_Rect.y);
                } else if (a_Index == 2.0) {
                    position = vec2(u_Rect.z, u_Rect.w);
                } else {
                    position = vec2(u_Rect.x, u_Rect.w);
                }

                v_IntPosition = position + vec2(0.5, 0.0);

                position += vec2(0.5, 0.0);
                position = position - u_Camera;

                // (0, 0) --> (-1, 1)
                // (80, 72) --> (0, 0)
                // (159, 143) --> (1, -1)
                
                position.x = position.x / (WIDTH / 2.0) - 1.0;
                position.y = -(position.y / (HEIGHT / 2.0) - 1.0);

                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        let fshader1Source = `#version 300 es
            precision highp float;

            uniform vec3 u_Color;
            uniform bool u_Solid;

            uniform int u_Fillp;

            in vec4 v_Rect;

            in vec2 v_IntPosition;

            out vec4 FragColor;

            void main() {
                FragColor = vec4(u_Color, 1.0);
                if (!u_Solid) {
                    float dx = min(abs(v_IntPosition.x - v_Rect.x), abs(v_IntPosition.x - v_Rect.z));
                    float dy = min(abs(v_IntPosition.y - v_Rect.y), abs(v_IntPosition.y - v_Rect.w));

                    if (dx > 1.0 && dy > 1.0) {
                        FragColor.a = 0.0;
                    }
                }

                int row = int(v_IntPosition.y) % 4;
                int col = int(v_IntPosition.x) % 4;

                row = 3 - row;

                bool bit = (((u_Fillp >> (row * 4)) & 0xF) & (8 >> col)) != 0;

                if (bit) {
                    FragColor.a = 0.0;
                }

            }
        `;

        system.__rectshader = new ShaderProgram(vshader1Source, fshader1Source, {
            attributes: ["a_Index"],
            uniforms: ["u_Camera", "u_Rect", "u_Color", "u_Solid", "u_Fillp"],
        });

        system.__rectshaderBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, system.__rectshaderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

    }


}

async function rectfill(x1, y1, x2, y2, color = system.color) {
    __rectDraw(x1, y1, x2, y2, true, color);
}

async function rect(x1, y1, x2, y2, color = system.color) {
    __rectDraw(x1, y1, x2, y2, false, color);
}


async function __rectDraw(x1, y1, x2, y2, solid, color) {
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(system.__rectshader.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, system.__rectshaderBuffer);

    gl.vertexAttribPointer(system.__rectshader.locations["a_Index"], 1, gl.FLOAT, false, 1 * FSIZE, 0);
    gl.enableVertexAttribArray(system.__rectshader.locations["a_Index"]);

    gl.uniform4fv(system.__rectshader.locations["u_Rect"], [x1, y1, x2 + 1, y2 + 1]);
    gl.uniform2fv(system.__rectshader.locations["u_Camera"], [system.__cameraX, system.__cameraY]);
    gl.uniform3fv(system.__rectshader.locations["u_Color"], color);
    gl.uniform1f(system.__rectshader.locations["u_Solid"], solid);
    gl.uniform1i(system.__rectshader.locations["u_Fillp"], system.__fillp);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disable(gl.BLEND);

}

async function cls(color = [0, 0, 0]) {
    gl.clearColor(color[0], color[1], color[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

async function fillp(pattern = 0) {
    if (typeof pattern === "string") {
        pattern = parseInt(pattern, 2);
    }
    system.__fillp = pattern;
}
