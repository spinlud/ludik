// Numeric image comparison for parity captures.
// Usage: node compare.js <dirA> <dirB>
//
// For every PNG that exists in both directories it prints:
//   - mean absolute per-channel difference (0-255)
//   - RMSE over all channels (0-255)
//   - per-quadrant mean luminance for each image (0-255), so "darker by X%" is
//     quantifiable (luminance = 0.2126 R + 0.7152 G + 0.0722 B)
//
// Plain Node + pngjs, no native deps. Images must have identical dimensions
// (the harness fixes the viewport so they do).

const fs = require("fs")
const path = require("path")
const { PNG } = require("pngjs")

const dirA = process.argv[2]
const dirB = process.argv[3]

if (!dirA || !dirB) {
    console.error("Usage: node compare.js <dirA> <dirB>")
    process.exit(1)
}

const resolveDir = (d) => (path.isAbsolute(d) ? d : path.join(__dirname, "captures", d))
const a = resolveDir(dirA)
const b = resolveDir(dirB)

const readPng = (file) => PNG.sync.read(fs.readFileSync(file))

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

// Mean luminance for each of the 4 quadrants (TL, TR, BL, BR).
function quadrantLuminance(png) {
    const { width, height, data } = png
    const halfW = Math.floor(width / 2)
    const halfH = Math.floor(height / 2)
    const sums = [0, 0, 0, 0]
    const counts = [0, 0, 0, 0]
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const q = (y < halfH ? 0 : 2) + (x < halfW ? 0 : 1)
            sums[q] += luminance(data[i], data[i + 1], data[i + 2])
            counts[q]++
        }
    }
    return sums.map((s, i) => s / counts[i])
}

function meanLuminance(png) {
    const { width, height, data } = png
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
        sum += luminance(data[i], data[i + 1], data[i + 2])
    }
    return sum / (width * height)
}

// Mean absolute per-channel diff and RMSE over RGB channels.
function diff(pngA, pngB) {
    const { width, height, data: da } = pngA
    const db = pngB.data
    let absSum = 0
    let sqSum = 0
    let n = 0
    for (let i = 0; i < da.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const d = Math.abs(da[i + c] - db[i + c])
            absSum += d
            sqSum += d * d
            n++
        }
    }
    return { mad: absSum / n, rmse: Math.sqrt(sqSum / n) }
}

const fmt = (x) => x.toFixed(2)
const fmtQ = (q) => `[TL ${fmt(q[0])}  TR ${fmt(q[1])}  BL ${fmt(q[2])}  BR ${fmt(q[3])}]`

const filesA = fs.existsSync(a) ? fs.readdirSync(a).filter((f) => f.endsWith(".png")) : []
const pairs = filesA.filter((f) => fs.existsSync(path.join(b, f)))

if (pairs.length === 0) {
    console.error(`No matching PNG pairs between:\n  A: ${a}\n  B: ${b}`)
    process.exit(1)
}

console.log(`Comparing:\n  A: ${a}\n  B: ${b}\n`)

for (const file of pairs.sort()) {
    const pngA = readPng(path.join(a, file))
    const pngB = readPng(path.join(b, file))

    console.log(`### ${file}`)
    if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
        console.log(`  SKIP: dimensions differ (A ${pngA.width}x${pngA.height}, B ${pngB.width}x${pngB.height})`)
        console.log("")
        continue
    }

    const { mad, rmse } = diff(pngA, pngB)
    const meanA = meanLuminance(pngA)
    const meanB = meanLuminance(pngB)
    const qA = quadrantLuminance(pngA)
    const qB = quadrantLuminance(pngB)
    const lumDeltaPct = meanA === 0 ? 0 : ((meanB - meanA) / meanA) * 100

    console.log(`  mean abs diff (0-255): ${fmt(mad)}`)
    console.log(`  RMSE          (0-255): ${fmt(rmse)}`)
    console.log(`  mean luminance A: ${fmt(meanA)}   B: ${fmt(meanB)}   (B is ${fmt(lumDeltaPct)}% vs A)`)
    console.log(`  quad luminance A: ${fmtQ(qA)}`)
    console.log(`  quad luminance B: ${fmtQ(qB)}`)
    console.log("")
}
