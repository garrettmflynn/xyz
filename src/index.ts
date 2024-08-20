const THEMES = ['professional', 'dark'];
if (localStorage.getItem('theme') === null) localStorage.setItem('theme', THEMES[0]);

type ObjectType = {
    draw: (ctx: CanvasRenderingContext2D) => void
} & ({} | { onClick: () => void, isIntersecting: (x: number, y: number, size: number) => boolean })

const STATES = {
    canvasRotation: 0,
    _lastFrameTime: performance.now(),
    objects: []
} as {
    canvasRotation: number,
    _lastFrameTime: number,
    objects: ObjectType[]
}

const rotationSpeedPerSecond = 1;

const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const currentIdx = THEMES.indexOf(currentTheme);
    const nextIdx = (currentIdx + 1) % THEMES.length;
    updateTheme(THEMES[nextIdx]);
}

const CIRCLE = {
    radius: 0.1,
    color: {
        dark: 'white',
        professional: 'black'  
    },


    getX (time: number, size: number) {
        return size / 2
    },

    getY(time: number, size: number) {
        const period = 2000;
        // const amplitude = 0.01 * size;
        const amplitude = 0.05 * size;
        return size / 2 + amplitude * Math.sin(2 * Math.PI * time / period)
    },

    getPosition (time: number, size: number) {
        return {
            x: this.getX(time, size),
            y: this.getY(time, size)
        }
    },

    isIntersecting(x: number, y: number, size: number) {
        const time = performance.now();
        const {x: cx, y: cy } = this.getPosition(time, size);
        const radius = this.radius * size;
        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        return distance < radius;
    },

    onClick: () => toggleTheme(),

    draw (ctx: CanvasRenderingContext2D) {
        const size = ctx.canvas.width;
        const radius = this.radius * size;
        const theme = getCurrentTheme();
        const time = performance.now();
        const { x, y } = this.getPosition(time, size);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color[theme];
        ctx.fill();
        ctx.closePath();


    }
}

const RETICULE = {
    x: 0,
    y: 0,
    radius: 0.01,
    color: {
        dark: 'white',
        professional: 'black'  
    },
    draw: function (ctx: CanvasRenderingContext2D) {

        if (this.x === 0 && this.y === 0) return;

        const size = ctx.canvas.width;

        const theme = getCurrentTheme();

        if (theme === 'dark') {
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.radius * size, 0, 2 * Math.PI)
            ctx.fillStyle = this.color[theme]
            ctx.fill()
            ctx.closePath()
        }

        else {
            const x = this.x - this.radius * size;
            const y = this.y - this.radius * size;
            const width = this.radius * size * 2;
            const height = this.radius * size * 2;
            ctx.fillStyle = this.color[theme];
            ctx.fillRect(x, y, width, height);
        }
    }
}

STATES.objects.push(CIRCLE, RETICULE);

  
document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.querySelector('canvas')!
    const ctx = canvas.getContext("2d")!


    // Check intersections on click
    canvas.onclick = (ev) => {
        const { offsetX, offsetY } = ev as MouseEvent;
        const size = canvas.getBoundingClientRect().width;
        STATES.objects.forEach(obj => {
            if ('onClick' in obj && 'isIntersecting' in obj) {
                if (obj.isIntersecting(offsetX, offsetY, size)) obj.onClick();
            }
        })
    }

    canvas.onmouseleave = () => Object.assign(RETICULE, { x: 0, y: 0 });

    canvas.onmousemove = (ev) => {
        const { offsetX, offsetY } = ev as MouseEvent;
        const domCoords = { x: offsetX, y: offsetY };
        const dims = canvas.getBoundingClientRect();
        const canvasCoords = { x: domCoords.x * (canvas.width / dims.width), y: domCoords.y * (canvas.height / dims.height) };
        Object.assign(RETICULE, canvasCoords);
    }


    const resizeCanvas = () => canvas.width = canvas.height = 2 * Math.min(window.innerWidth, window.innerHeight);

    const draw = () => {

        const isDark = getCurrentTheme() === 'dark';

        canvas.style.transform = `rotate(${STATES.canvasRotation}rad)`;

        //Makes sure the canvas is clean at the beginning of a frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        STATES.objects.forEach(obj => obj.draw(ctx));

        if (isDark) {
            const { _lastFrameTime } = STATES;
            // if (_lastFrameTime) STATES.canvasRotation += rotationSpeedPerSecond * (performance.now() - _lastFrameTime) / 1000;

            STATES._lastFrameTime = performance.now();
        }

        requestAnimationFrame(draw);
    }

    addEventListener("resize", resizeCanvas, false);

    resizeCanvas();
    draw();
})

const updateTheme = (theme = getCurrentTheme()) => requestAnimationFrame(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  })
  
  const getCurrentTheme = () => localStorage.getItem('theme')!;
  updateTheme();