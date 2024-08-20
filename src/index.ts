const THEMES = ['professional', 'dark'];
if (localStorage.getItem('theme') === null) localStorage.setItem('theme', THEMES[0]);

type ObjectType = {
    draw: (ctx: CanvasRenderingContext2D) => void
} & ({} | { onClick: () => void, isIntersecting: (x: number, y: number, canvas: HTMLCanvasElement) => boolean })

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


    getX (time: number, width: number) {
        return width / 2
    },

    getY(time: number, height: number) {
        const period = 2000;
        const amplitude = 0.05 * height;
        return height / 2 + amplitude * Math.sin(2 * Math.PI * time / period)
    },

    isIntersecting(x: number, y: number, canvas: HTMLCanvasElement) {
        const time = performance.now();

        const { width, height } = canvas.getBoundingClientRect();
        const cx = this.getX(time, width);
        const cy = this.getY(time, height);
        const radius = this.radius * width;
        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        return distance < radius;
    },

    onClick: () => toggleTheme(),

    draw (ctx: CanvasRenderingContext2D) {
        const { width, height } = ctx.canvas;
        const radius = this.radius * width;
        const theme = getCurrentTheme();
        const time = performance.now();
        const x = this.getX(time, width);
        const y = this.getY(time, height);
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

        const { width } = ctx.canvas;

        const radiusScale = width

        const theme = getCurrentTheme();

        if (theme === 'dark') {
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.radius * radiusScale, 0, 2 * Math.PI)
            ctx.fillStyle = this.color[theme]
            ctx.fill()
            ctx.closePath()
        }

        else {
            const x = this.x - this.radius * radiusScale;
            const y = this.y - this.radius * radiusScale;
            const w = this.radius * radiusScale * 2;
            const h = this.radius * radiusScale * 2;
            ctx.fillStyle = this.color[theme];
            ctx.fillRect(x, y, w, h);
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
        STATES.objects.forEach(obj => {
            if ('onClick' in obj && 'isIntersecting' in obj) {
                if (obj.isIntersecting(offsetX, offsetY, canvas)) obj.onClick();
            }
        })
    }

    canvas.onmouseleave = () => Object.assign(RETICULE, { x: 0, y: 0 });

    canvas.onmousemove = (ev) => {
        const { offsetX, offsetY } = ev as MouseEvent;
        const domCoords = { x: offsetX, y: offsetY };
        const { width, height } = canvas.getBoundingClientRect();
        const canvasCoords = { x: domCoords.x * (canvas.width / width), y: domCoords.y * (canvas.height / height) };
        Object.assign(RETICULE, canvasCoords);
    }


    const resizeCanvas = () => {
        canvas.height = 2 * Math.min(window.innerWidth, window.innerHeight)
        canvas.width = 1.5 * canvas.height
    };

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