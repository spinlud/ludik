// Smoke checks for the Home view (albums, singles, DJ sets, intro console).
// Boots the app, passes the click-to-start gate, walks the player into the
// stargate so the World stops and Home is revealed, then runs named checks.
// Prints PASS/FAIL per check and exits non-zero on any failure.
// Usage: node smoke-home.js <baseUrl> [outDir]

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const baseUrl = process.argv[2]
const outDirArg = process.argv[3] || "smoke-home"

if (!baseUrl) {
    console.error("Usage: node smoke-home.js <baseUrl> [outDir]")
    process.exit(1)
}

const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.join(__dirname, "captures", outDirArg)
fs.mkdirSync(outDir, { recursive: true })

const VIEWPORT = { width: 1280, height: 800 }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// Boot: loading screen -> click-to-start gate -> World -> stargate -> Home
// ---------------------------------------------------------------------------

async function passGate (page) {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
    await page.bringToFront()
    await wait(9000)
    const center = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 }
    for (let i = 0; i < 3; i++) {
        await page.bringToFront()
        await page.mouse.click(center.x, center.y)
        await wait(2500)
    }
    await page.waitForFunction(() => !!window.__ludikParity, null, { timeout: 30000 })
}

// World-space centre of a named scene object, read through the parity hook.
async function objectCentre (page, name) {
    return page.evaluate((objName) => {
        const { composer } = window.__ludikParity.getPostProcessing()
        const scene = composer.passes.map((p) => p.scene).find(Boolean)
        const obj = scene && scene.getObjectByName(objName)
        if (!obj) return null
        const v = obj.position.clone()
        obj.getWorldPosition(v)
        return { x: v.x, z: v.z }
    }, name)
}

// Zone detection only moves bridge -> stargate, so step onto the bridge first.
async function enterHomeViaStargate (page) {
    const bridge = await objectCentre(page, "PolyArea_Bridge")
    const stargate = await objectCentre(page, "PolyArea_Stargate")
    if (!bridge || !stargate) throw new Error("stargate/bridge areas not found in scene")
    const setXZ = (p) => page.evaluate(({ x, z }) => {
        const pose = window.__ludikParity.getPose()
        window.__ludikParity.setPose(x, pose.y, z, pose.pitch, pose.yaw)
    }, p)
    await page.bringToFront()
    await setXZ(bridge)
    await wait(1000)
    await setXZ(stargate)
    // Stargate load time is ~8s before the World stops.
    await page.waitForSelector("#homeContent", { state: "visible", timeout: 30000 })
    await wait(1500)
}

// ---------------------------------------------------------------------------
// Helpers for checks
// ---------------------------------------------------------------------------

const helpers = (page) => ({
    page,
    wait,
    // Navigate by clicking a menu ring (ScifiMenu) by its display name.
    async viaRing (displayName) {
        await page.locator("#scifiMenu li", { hasText: displayName }).first().click()
        await wait(2000)
    },
    // Navigate via the hamburger menu entry with the given label.
    async viaHamburger (label) {
        await page.click("#hamburger")
        await wait(1200)
        await page.locator("#menu-list li", { hasText: label }).first().click()
        await wait(2000)
    },
    // Client-side route change with ?scroll=true plus any extra query, keeping the app state.
    async gotoRoute (routePath, extraQuery = {}) {
        await page.evaluate(({ p, q }) => {
            const router = document.querySelector("#app").__vue_app__.config.globalProperties.$router
            return router.push({ path: p, query: { scroll: "true", ...q } })
        }, { p: routePath, q: extraQuery })
        await wait(2000)
    },
    // src attributes of iframes inside a container selector.
    async iframes (selector = "body") {
        return page.$$eval(`${selector} iframe`, (els) => els.map((e) => e.getAttribute("src") || ""))
    },
    async screenshot (name) {
        await page.screenshot({ path: path.join(outDir, `${name}.png`) })
    },
})

// ---------------------------------------------------------------------------
// Checks: each returns nothing on success and throws on failure.
// ---------------------------------------------------------------------------

const checks = {}

// --- check: homeVisible ---
checks.homeVisible = async (h) => {
    const visible = await h.page.isVisible("#homeContent")
    if (!visible) throw new Error("#homeContent is not visible")
    await h.screenshot("home")
}

// --- check: intro ---
// The console starts typing when Home is first revealed, ends with exactly one
// "get in touch" link, and a mid-typing replay still ends with exactly one link.
checks.intro = async (h) => {
    const consoleText = () => h.page.$eval("#homeConsoleMessage", (el) => el.textContent || "")
    const linkCount = () => h.page.$$eval("#homeConsoleMessage span", (els) =>
        els.filter((e) => (e.textContent || "").includes("get in touch")).length)
    const waitForLink = () => h.page.waitForFunction(() =>
        Array.from(document.querySelectorAll("#homeConsoleMessage span"))
            .some((e) => (e.textContent || "").includes("get in touch")), null, { timeout: 60000 })

    const early = await consoleText()
    await waitForLink()
    await h.wait(1500)
    const full = await consoleText()
    if (early.length === 0) throw new Error("console is empty right after Home was revealed")
    if (early.length >= full.length) throw new Error(`console already finished on reveal (${early.length}/${full.length} chars)`)
    let links = await linkCount()
    if (links !== 1) throw new Error(`expected 1 link after typing, found ${links}`)

    await h.page.click("#homeConsoleReload")
    await h.wait(3000)
    await h.page.click("#homeConsoleReload")
    await h.wait(1500)
    await waitForLink()
    // Any interrupted run must also have settled: wait until the text is stable for 5s.
    for (let prev = "", t = 0; t < 60; t++) {
        const now = await h.page.$eval("#homeConsoleMessage", (el) => el.innerHTML)
        if (now === prev) break
        prev = now
        await h.wait(5000)
    }
    links = await linkCount()
    await h.screenshot("intro")
    if (links !== 1) throw new Error(`expected 1 link after replay, found ${links}`)
}

// --- check: albums ---
checks.albums = async (h) => {
    const POSITRON_PLAYLIST = "playlists%2F687008079"
    const POSITRON_TRACKS = ["559868439", "559868427", "559868409", "559868391", "559868373"]
    const assertNoSpotify = async () => {
        const all = await h.iframes("body")
        if (all.some((s) => s.includes("spotify"))) throw new Error("a Spotify iframe is present")
        const links = await h.page.$$eval("#albums a", (els) => els.map((a) => a.href))
        if (links.some((l) => /spotify|song\.link/.test(l))) throw new Error("a Spotify/song.link link is present")
    }
    const soundcloud = async () => (await h.iframes("#albums")).filter((s) => s.startsWith("https://w.soundcloud.com/player/"))

    await h.gotoRoute("/albums")
    await assertNoSpotify()
    let sc = await soundcloud()
    if (sc.length !== 1 || !sc[0].includes(POSITRON_PLAYLIST)) {
        throw new Error(`layout a: expected only the Positron playlist player, got ${JSON.stringify(sc)}`)
    }
    await h.page.locator("#albums").screenshot({ path: path.join(outDir, "albums-a.png") })

    await h.gotoRoute("/albums", { layout: "b" })
    await assertNoSpotify()
    sc = await soundcloud()
    const playlists = sc.filter((s) => s.includes(POSITRON_PLAYLIST))
    const missing = POSITRON_TRACKS.filter((id) => !sc.some((s) => s.includes(`tracks%2F${id}`)))
    if (playlists.length !== 1 || sc.length !== 6 || missing.length) {
        throw new Error(`layout b: expected playlist + 5 track players, got ${JSON.stringify(sc)}`)
    }
    await h.page.locator("#albums").screenshot({ path: path.join(outDir, "albums-b.png") })
}

// --- check: djSets ---
// Reachable via the "DJ Sets" ring and the hamburger entry; shows the Soriano
// player, its description and the 13-row tracklist.
checks.djSets = async (h) => {
    const assertSection = async (via) => {
        await h.page.waitForSelector("#dj-sets", { state: "visible", timeout: 5000 })
            .catch(() => { throw new Error(`${via}: #dj-sets not visible`) })
        const sc = await h.iframes("#dj-sets")
        if (!sc.some((s) => s.startsWith("https://w.soundcloud.com/player/") && s.includes("tracks%2F1640525379"))) {
            throw new Error(`${via}: Soriano player missing, got ${JSON.stringify(sc)}`)
        }
        const text = await h.page.$eval("#dj-sets", (el) => el.textContent || "")
        if (!text.includes("Set performed at Soriano Street Boulder climbing festival - September 2023")) {
            throw new Error(`${via}: description missing`)
        }
        const rows = await h.page.$$eval("#dj-sets .tracklist-row", (els) => els.length)
        if (rows !== 13) throw new Error(`${via}: expected 13 tracklist rows, found ${rows}`)
    }

    await h.gotoRoute("/")
    await h.viaRing("DJ Sets")
    await assertSection("ring")
    await h.page.locator("#dj-sets").screenshot({ path: path.join(outDir, "dj-sets.png") })
    await h.page.setViewportSize({ width: 390, height: 844 })
    await h.wait(1000)
    await h.page.locator("#dj-sets").screenshot({ path: path.join(outDir, "dj-sets-narrow.png") })
    await h.page.setViewportSize(VIEWPORT)
    await h.wait(1000)

    await h.gotoRoute("/")
    await h.viaHamburger("DJ Sets")
    await assertSection("hamburger")
}

// --- check: singles ---
// Singles lists The Rise Of The Zombies first, with its SoundCloud player.
checks.singles = async (h) => {
    await h.gotoRoute("/singles")
    const titles = await h.page.$$eval("#singles .release-title", (els) => els.map((e) => e.textContent.trim()))
    if (titles[0] !== "The Rise Of The Zombies") throw new Error(`first single is ${JSON.stringify(titles[0])}`)
    const date = await h.page.$eval("#singles .release-date", (e) => e.textContent.trim())
    if (date !== "08-2021") throw new Error(`release date is ${JSON.stringify(date)}`)
    const sc = await h.iframes("#singles")
    if (!sc[0] || !sc[0].startsWith("https://w.soundcloud.com/player/") || !sc[0].includes("tracks%2F1102903111")) {
        throw new Error(`expected the Zombies player first, got ${JSON.stringify(sc)}`)
    }
    const art = await h.page.$eval("#singles .release-artwork", (e) => e.complete && e.naturalWidth > 0)
    if (!art) throw new Error("artwork did not load")
    await h.page.locator("#singles").screenshot({ path: path.join(outDir, "singles.png") })
}

// ---------------------------------------------------------------------------

;(async () => {
    const consoleLines = []
    const results = []
    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
    page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`))

    try {
        await passGate(page)
        await enterHomeViaStargate(page)
        const h = helpers(page)
        for (const [name, fn] of Object.entries(checks)) {
            try {
                await page.bringToFront()
                await fn(h)
                results.push({ name, ok: true })
                console.log(`PASS ${name}`)
            } catch (e) {
                results.push({ name, ok: false })
                console.log(`FAIL ${name}: ${e.message}`)
            }
        }
    } catch (e) {
        results.push({ name: "boot", ok: false })
        console.log(`FAIL boot: ${e.message}`)
        await page.screenshot({ path: path.join(outDir, "boot-fail.png") }).catch(() => {})
    } finally {
        fs.writeFileSync(path.join(outDir, "console.txt"), consoleLines.join("\n"))
        await browser.close()
    }

    const failed = results.filter((r) => !r.ok).length
    console.log(failed ? `${failed} check(s) failed` : "ALL PASS")
    process.exit(failed ? 1 : 0)
})()
