<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Tetris Neon Kineticism</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "surface-container": "#11192a",
                        "background": "#070e1b",
                        "tertiary-container": "#cafd00",
                        "surface-container-high": "#172031",
                        "on-primary-container": "#005359",
                        "tertiary-fixed-dim": "#beee00",
                        "on-primary-fixed": "#003f43",
                        "on-surface-variant": "#a5abbd",
                        "primary": "#8ff5ff",
                        "on-secondary-container": "#fff5f9",
                        "on-secondary-fixed": "#620061",
                        "surface": "#070e1b",
                        "surface-tint": "#8ff5ff",
                        "secondary-fixed": "#ffbdf3",
                        "error-container": "#9f0519",
                        "primary-fixed-dim": "#00deec",
                        "on-background": "#e2e8fb",
                        "tertiary-fixed": "#cafd00",
                        "surface-container-highest": "#1c2639",
                        "primary-fixed": "#00eeec",
                        "surface-dim": "#070e1b",
                        "inverse-primary": "#006a71",
                        "on-primary-fixed-variant": "#005e64",
                        "on-secondary-fixed-variant": "#920091",
                        "primary-container": "#00eefc",
                        "on-tertiary-fixed": "#3a4a00",
                        "on-tertiary-fixed-variant": "#526900",
                        "tertiary": "#f3ffca",
                        "surface-variant": "#1c2639",
                        "inverse-surface": "#f9f9ff",
                        "on-secondary": "#400040",
                        "tertiary-dim": "#beee00",
                        "secondary": "#ff51fa",
                        "on-surface": "#e2e8fb",
                        "on-error-container": "#ffa8a3",
                        "primary-dim": "#00deec",
                        "surface-container-low": "#0c1322",
                        "outline-variant": "#414857",
                        "on-primary": "#005d63",
                        "secondary-dim": "#ff51fa",
                        "secondary-fixed-dim": "#ffa6f3",
                        "secondary-container": "#a900a9",
                        "error-dim": "#d7383b",
                        "outline": "#6f7586",
                        "on-tertiary-container": "#4a5e00",
                        "on-tertiary": "#516700",
                        "surface-bright": "#222c41",
                        "inverse-on-surface": "#4e5565",
                        "on-error": "#490006",
                        "error": "#ff716c"
                    },
                    fontFamily: {
                        "headline": ["Space Grotesk"],
                        "body": ["Plus Jakarta Sans"],
                        "label": ["Space Grotesk"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        /* Ensuring perfect squares for the grid and blocks */
        .tetris-grid {
            background-image: 
                linear-gradient(to right, rgba(65, 72, 87, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(65, 72, 87, 0.4) 1px, transparent 1px);
            /* 10 columns, background-size is 1/10th for width */
            background-size: 10% calc(100% / 20);
            background-position: -0.5px -0.5px;
            /* Aspect ratio 10:20 (1:2) ensures rows/cols are equal in size if height is twice width */
            aspect-ratio: 10 / 20;
            position: relative;
        }

        /* Standard block with black outline and lighter inner border for depth */
        .tetris-block {
            width: 100%;
            height: 100%;
            border: 1px solid #000;
            position: relative;
            box-sizing: border-box;
        }
        .tetris-block::after {
            content: '';
            position: absolute;
            inset: 2px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            pointer-events: none;
        }

        /* Container for blocks within the grid */
        .block-cell {
            position: absolute;
            width: 10%;
            height: 5%;
        }

        /* Standard Tetris Colors */
        .block-cyan { background-color: #00f0f0; } /* I */
        .block-blue { background-color: #0000f0; } /* J */
        .block-orange { background-color: #f0a000; } /* L */
        .block-yellow { background-color: #f0f000; } /* O */
        .block-lime { background-color: #00f000; } /* S */
        .block-magenta { background-color: #a000f0; } /* T */
        .block-red { background-color: #f00000; } /* Z */

        body {
            min-height: 100dvh;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body overflow-hidden h-screen flex flex-col">
<!-- Minimalist Top Bar -->
<header class="fixed top-0 w-full z-50 bg-transparent flex justify-between items-center px-6 py-4">
<button class="active:scale-95 transition-transform text-slate-400 hover:text-cyan-200">
<span class="material-symbols-outlined">menu</span>
</button>
<h1 class="font-['Space_Grotesk'] uppercase tracking-[0.05em] text-lg font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
            TETRIS NEON
        </h1>
<button class="active:scale-95 transition-transform text-slate-400 hover:text-cyan-200">
<span class="material-symbols-outlined">settings</span>
</button>
</header>
<main class="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8 relative">
<!-- Scoreboard Prominently above the map -->
<div class="w-full flex flex-col items-center mb-4">
<span class="font-headline text-[10px] tracking-[0.2em] text-on-surface-variant uppercase">Current Score</span>
<span class="font-headline text-5xl font-bold text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(143,245,255,0.4)]">
                128,450
            </span>
</div>
<div class="w-full max-w-lg flex items-stretch justify-center gap-6 h-[65vh]">
<!-- Side Panel Left: HELD (Large and clear) -->
<div class="hidden md:flex flex-1 flex-col gap-4 max-w-[100px]">
<div class="flex-1 bg-surface-container-high/40 backdrop-blur-xl rounded-xl border border-outline-variant/20 p-4 flex flex-col items-center">
<span class="font-headline text-[10px] tracking-widest text-secondary uppercase mb-6">Held</span>
<div class="grid grid-cols-2 gap-0.5 w-full">
<div class="aspect-square tetris-block block-magenta"></div>
<div class="aspect-square tetris-block block-magenta"></div>
<div class="aspect-square"></div>
<div class="aspect-square tetris-block block-magenta"></div>
</div>
</div>
<div class="bg-surface-container-low rounded-lg p-3 flex flex-col items-center border border-outline-variant/10">
<span class="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase mb-1">Level</span>
<span class="font-headline text-xl font-bold text-on-surface">14</span>
</div>
</div>
<!-- Central Game Board -->
<div class="h-full bg-surface-container-low rounded-xl border-2 border-surface-container-highest relative overflow-hidden tetris-grid">
<!-- Active Piece (The "I" Block) -->
<div class="block-cell left-[40%] top-[20%]"><div class="tetris-block block-cyan"></div></div>
<div class="block-cell left-[40%] top-[25%]"><div class="tetris-block block-cyan"></div></div>
<div class="block-cell left-[40%] top-[30%]"><div class="tetris-block block-cyan"></div></div>
<div class="block-cell left-[40%] top-[35%]"><div class="tetris-block block-cyan"></div></div>
<!-- Ghost Piece -->
<div class="block-cell left-[40%] top-[80%] opacity-20"><div class="w-full h-full border border-cyan-400 bg-cyan-400/30"></div></div>
<div class="block-cell left-[40%] top-[85%] opacity-20"><div class="w-full h-full border border-cyan-400 bg-cyan-400/30"></div></div>
<div class="block-cell left-[40%] top-[90%] opacity-20"><div class="w-full h-full border border-cyan-400 bg-cyan-400/30"></div></div>
<div class="block-cell left-[40%] top-[95%] opacity-20"><div class="w-full h-full border border-cyan-400 bg-cyan-400/30"></div></div>
<!-- Stacked Blocks at bottom -->
<div class="block-cell left-[0%] top-[95%]"><div class="tetris-block block-blue"></div></div>
<div class="block-cell left-[10%] top-[95%]"><div class="tetris-block block-blue"></div></div>
<div class="block-cell left-[20%] top-[95%]"><div class="tetris-block block-blue"></div></div>
<div class="block-cell left-[30%] top-[95%]"><div class="tetris-block block-blue"></div></div>
<div class="block-cell left-[40%] top-[95%]"><div class="tetris-block block-red"></div></div>
<div class="block-cell left-[50%] top-[95%]"><div class="tetris-block block-red"></div></div>
<div class="block-cell left-[60%] top-[95%]"><div class="tetris-block block-red"></div></div>
<div class="block-cell left-[70%] top-[95%]"><div class="tetris-block block-red"></div></div>
<div class="block-cell left-[0%] top-[90%]"><div class="tetris-block block-lime"></div></div>
<div class="block-cell left-[10%] top-[90%]"><div class="tetris-block block-lime"></div></div>
<div class="block-cell left-[40%] top-[90%]"><div class="tetris-block block-orange"></div></div>
<div class="block-cell left-[50%] top-[90%]"><div class="tetris-block block-orange"></div></div>
<div class="block-cell left-[60%] top-[90%]"><div class="tetris-block block-orange"></div></div>
</div>
<!-- Side Panel Right: NEXT (Large and clear) -->
<div class="hidden md:flex flex-1 flex-col gap-4 max-w-[100px]">
<div class="flex-1 bg-surface-container-high/40 backdrop-blur-xl rounded-xl border border-outline-variant/20 p-4 flex flex-col items-center">
<span class="font-headline text-[10px] tracking-widest text-primary uppercase mb-6">Next</span>
<div class="flex flex-col gap-8 items-center w-full">
<!-- Preview 1 -->
<div class="grid grid-cols-2 gap-0.5 w-full">
<div class="aspect-square tetris-block block-red"></div>
<div class="aspect-square tetris-block block-red"></div>
<div class="aspect-square"></div>
<div class="aspect-square tetris-block block-red"></div>
</div>
<!-- Preview 2 (Secondary) -->
<div class="grid grid-cols-1 gap-0.5 w-4 opacity-50">
<div class="aspect-square tetris-block block-cyan"></div>
<div class="aspect-square tetris-block block-cyan"></div>
<div class="aspect-square tetris-block block-cyan"></div>
<div class="aspect-square tetris-block block-cyan"></div>
</div>
</div>
</div>
<div class="bg-surface-container-low rounded-lg p-3 flex flex-col items-center border border-outline-variant/10">
<span class="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase mb-1">Lines</span>
<span class="font-headline text-xl font-bold text-on-surface">142</span>
</div>
</div>
</div>
<!-- Mobile Previews (visible when side panels are hidden) -->
<div class="md:hidden flex gap-8 mt-6">
<div class="flex flex-col items-center">
<span class="font-headline text-[8px] tracking-widest text-secondary uppercase mb-2">Held</span>
<div class="grid grid-cols-2 gap-0.5 w-8">
<div class="aspect-square tetris-block block-magenta"></div>
<div class="aspect-square tetris-block block-magenta"></div>
<div class="aspect-square"></div>
<div class="aspect-square tetris-block block-magenta"></div>
</div>
</div>
<div class="flex flex-col items-center">
<span class="font-headline text-[8px] tracking-widest text-primary uppercase mb-2">Next</span>
<div class="grid grid-cols-2 gap-0.5 w-8">
<div class="aspect-square tetris-block block-red"></div>
<div class="aspect-square tetris-block block-red"></div>
<div class="aspect-square"></div>
<div class="aspect-square tetris-block block-red"></div>
</div>
</div>
</div>
</main>
<!-- Background Decoration -->
<div class="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
<div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
<div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]"></div>
</div>
</body></html>