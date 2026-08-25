// Per-channel (R,G,B) mean reporter for parity captures.
// Usage:
//   node channelmeans.js <dirA> <dirB>                 compare all matching PNGs (whole frame)
//   node channelmeans.js <dirA> <dirB> --crop x,y,w,h  restrict means to a pixel box
//
// Prints, per pose, the mean R/G/B for each image and the R:G:B ratio (normalized
// to G=1.00) so a color tilt (e.g. an ocher sun disc) is quantifiable.
// Plain Node + pngjs, mirrors compare.js conventions.

const fs = require("fs")
const path = require("path")
const { PNG } = require("pngjs")

const args = process.argv.slice(2)
const positional = []
let crop = null
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--crop") {
        const parts = args[++i].split(",").map(Number)
        crop = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] }
    }
    else {
        positional.push(args[i])
    }
}

const [dirA, dirB] = positional
if (!dirA || !dirB) {
    console.error("Usage: node channelmeans.js <dirA> <dirB> [--crop x,y,w,h]")
    process.exit(1)
}

const resolveDir = (d) => (path.isAbsolute(d) ? d : path.join(__dirname, "captures", d))
const a = resolveDir(dirA)
const b = resolveDir(dirB)

const readPng = (file) => PNG.sync.read(fs.readFileSync(file))

function channelMeans(png, box) {
    const { width, height, data } = png
    const x0 = box ? Math.max(0, box.x) : 0
    const y0 = box ? Math.max(0, box.y) : 0
    const x1 = box ? Math.min(width, box.x + box.w) : width
    const y1 = box ? Math.min(height, box.y + box.h) : height
    let r = 0, g = 0, bl = 0, n = 0
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            const i = (y * width + x) * 4
            r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++
        }
    }
    return { r: r / n, g: g / n, b: bl / n, n }
}

const fmt = (x) => x.toFixed(2)
const ratio = (c) => `${(c.r / c.g).toFixed(3)}:1.000:${(c.b / c.g).toFixed(3)}`

const filesA = fs.existsSync(a) ? fs.readdirSync(a).filter((f) => f.endsWith(".png")) : []
const pairs = filesA.filter((f) => fs.existsSync(path.join(b, f))).sort()

if (pairs.length === 0) {
    console.error(`No matching PNG pairs between:\n  A: ${a}\n  B: ${b}`)
    process.exit(1)
}

console.log(`Channel means${crop ? ` (crop ${crop.x},${crop.y},${crop.w}x${crop.h})` : ""}:\n  A: ${a}\n  B: ${b}\n`)

for (const file of pairs) {
    const ca = channelMeans(readPng(path.join(a, file)), crop)
    const cb = channelMeans(readPng(path.join(b, file)), crop)
    console.log(`### ${file}   (n=${ca.n}px)`)
    console.log(`  A  R ${fmt(ca.r)}  G ${fmt(ca.g)}  B ${fmt(ca.b)}   R:G:B ${ratio(ca)}`)
    console.log(`  B  R ${fmt(cb.r)}  G ${fmt(cb.g)}  B ${fmt(cb.b)}   R:G:B ${ratio(cb)}`)
    console.log("")
}
