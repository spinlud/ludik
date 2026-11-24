// Smoke checks for the World (jump) and the Home view (albums, singles, DJ sets,
// intro console). Boots the app, passes the click-to-start gate, runs the World
// checks, then walks the player into the stargate so the World stops and Home
// is revealed, then runs the Home checks.
// Prints PASS/FAIL per check and exits non-zero on any failure.
// Runs headless with a stubbed Pointer Lock API, so it never captures the
// real mouse cursor or steals window focus. Pass --headed to watch the run.
// Usage: node smoke-home.js <baseUrl> [outDir] [--headed]

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const args = process.argv.slice(2)
const headed = args.includes("--headed")
const [baseUrl, outDirArg = "smoke-home"] = args.filter((a) => a !== "--headed")

if (!baseUrl) {
    console.error("Usage: node smoke-home.js <baseUrl> [outDir] [--headed]")
    process.exit(1)
}

const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.join(__dirname, "captures", outDirArg)
fs.mkdirSync(outDir, { recursive: true })

const VIEWPORT = { width: 1280, height: 800 }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Fakes a granted pointer lock: the app sees the canvas as locked and gets its
// pointerlockchange events, but the browser never captures the OS cursor.
// The checks move the player through the parity hook, not mouse-look.
function stubPointerLock () {
    let lockedElement = null
    const notify = () => setTimeout(() => document.dispatchEvent(new Event("pointerlockchange")), 0)
    Object.defineProperty(Document.prototype, "pointerLockElement", {
        configurable: true,
        get: () => lockedElement,
    })
    Element.prototype.requestPointerLock = function () {
        lockedElement = this
        notify()
        return Promise.resolve()
    }
    Document.prototype.exitPointerLock = function () {
        lockedElement = null
        notify()
    }
}

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
// worldChecks run in the World before the stargate, checks run once Home is visible.
// ---------------------------------------------------------------------------

const worldChecks = {}
const checks = {}

// --- check: jump ---
// Space lifts the camera once along a fixed arc and returns it to exactly the
// eye height. Holding Space and pressing it mid-air add nothing, a pause
// freezes the arc, and Space does nothing (and stays unprevented) while unlocked.
worldChecks.jump = async (h) => {
    const EYE_HEIGHT = 2.6
    const PEAK = 3.2
    const LANDED_AFTER = 2500
    const { page } = h
    const y = () => page.evaluate(() => window.__ludikParity.getPose().y)
    const assertGrounded = async (tag) => {
        const now = await y()
        if (now !== EYE_HEIGHT) throw new Error(`${tag}: y is ${now}, expected ${EYE_HEIGHT}`)
    }
    // Records y on every frame for the given time while `act` runs. Counts the
    // takeoffs (frames where y leaves the eye height) and the highest y.
    const record = async (ms, act) => {
        const samples = page.evaluate(({ ms, ground }) => new Promise((resolve) => {
            const start = performance.now()
            const out = { max: ground, takeoffs: 0, airborneMs: 0 }
            let prev = ground
            let takeoffAt = 0
            const tick = (now) => {
                const cur = window.__ludikParity.getPose().y
                out.max = Math.max(out.max, cur)
                if (prev === ground && cur !== ground) { out.takeoffs++; takeoffAt = now }
                if (prev !== ground && cur === ground) out.airborneMs = now - takeoffAt
                prev = cur
                if (performance.now() - start < ms) requestAnimationFrame(tick)
                else resolve(out)
            }
            requestAnimationFrame(tick)
        }), { ms, ground: EYE_HEIGHT })
        await act()
        return samples
    }
    const assertSingleJump = (tag, r) => {
        if (r.takeoffs !== 1) throw new Error(`${tag}: expected 1 takeoff, got ${r.takeoffs}`)
        if (r.max > PEAK + 1e-6 || r.max < PEAK - 0.1) throw new Error(`${tag}: peak y ${r.max}, expected ~${PEAK}`)
        if (r.airborneMs > 1500) throw new Error(`${tag}: airborne for ${Math.round(r.airborneMs)}ms, expected ~1000ms`)
    }
    const spacePrevented = () => page.evaluate(() => {
        const e = new KeyboardEvent("keydown", { keyCode: 32, cancelable: true, bubbles: true })
        document.dispatchEvent(e)
        return e.defaultPrevented
    })
    const lock = async () => {
        await page.evaluate(() => document.querySelector("#pointerLockOverlay").click())
        await h.wait(500)
    }
    const unlock = async () => {
        await page.evaluate(() => document.exitPointerLock())
        await h.wait(200)
    }

    await assertGrounded("before jump")
    assertSingleJump("press", await record(LANDED_AFTER, () => page.keyboard.press("Space")))
    await assertGrounded("after press")

    // Repeated down() without up() sends auto-repeat keydowns.
    const held = await record(LANDED_AFTER, async () => {
        for (let i = 0; i < 20; i++) {
            await page.keyboard.down("Space")
            await h.wait(90)
        }
        await page.keyboard.up("Space")
    })
    assertSingleJump("held", held)
    await assertGrounded("after held")

    const midAir = await record(LANDED_AFTER, async () => {
        await page.keyboard.press("Space")
        await h.wait(400)
        await page.keyboard.press("Space")
    })
    assertSingleJump("mid-air press", midAir)
    await assertGrounded("after mid-air press")

    await page.keyboard.press("Space")
    await h.wait(300)
    await unlock()
    const frozen = await y()
    await h.wait(2000)
    if (frozen === EYE_HEIGHT) throw new Error("pause: expected to be airborne")
    if (await y() !== frozen) throw new Error("pause: y changed while unlocked")
    if (await spacePrevented()) throw new Error("Space is prevented while unlocked")
    await lock()
    await h.wait(LANDED_AFTER)
    await assertGrounded("after resume")

    await unlock()
    const unlocked = await record(1000, () => page.keyboard.press("Space"))
    if (unlocked.takeoffs !== 0) throw new Error("Space jumped while unlocked")
    await lock()
    const resumed = await record(1000, async () => {})
    if (resumed.takeoffs !== 0) throw new Error("a press made while unlocked was replayed on resume")
    if (!await spacePrevented()) throw new Error("Space is not prevented while locked")
    await h.wait(LANDED_AFTER)
    await assertGrounded("after the last jump")
}

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

// --- check: releaseLayout ---
// Wide: artwork on the left; the player (166px for a track, ~450px for a
// playlist) heads the right column with the title under it; the slot content
// spans both columns below. Narrow: artwork, player, title stacked.
// Also captures wide and narrow screenshots of each section after the iframes load.
checks.releaseLayout = async (h) => {
    const NARROW = { width: 390, height: 844 }
    const sections = [
        { name: "albums", route: "/albums", root: "#albums", playerHeight: 450, slot: ".album-tracks" },
        { name: "albums-b", route: "/albums", query: { layout: "b" }, root: "#albums", playerHeight: 450, slot: ".album-tracks" },
        { name: "singles", route: "/singles", root: "#singles", playerHeight: 166 },
        { name: "dj-sets", route: "/dj-sets", root: "#dj-sets", playerHeight: 166, slot: ".tracklist" },
    ]
    const measure = (root, slot) => h.page.$eval(`${root} .release-li`, (li, slotSel) => {
        const box = (sel) => {
            const el = li.querySelector(sel)
            if (!el) return null
            const r = el.getBoundingClientRect()
            return { x: r.left, y: r.top, w: r.width, h: r.height, bottom: r.bottom, right: r.right }
        }
        return { li: box(":scope"), art: box(".release-artwork"), player: box(".release-player iframe"), title: box(".release-title"), slot: slotSel ? box(slotSel) : null }
    }, slot || null)
    const near = (a, b, tol) => Math.abs(a - b) <= tol

    for (const viewport of [VIEWPORT, NARROW]) {
        const wide = viewport === VIEWPORT
        await h.page.setViewportSize(viewport)
        for (const s of sections) {
            await h.gotoRoute(s.route, s.query || {})
            await h.wait(4000)
            // Scroll each player into view so the widgets load and paint, then
            // require every widget frame to show its play button.
            for (const frame of await h.page.$$(`${s.root} iframe`)) {
                await frame.scrollIntoViewIfNeeded()
                await h.wait(1500)
            }
            const widgets = h.page.frames().filter((f) => f.url().startsWith("https://w.soundcloud.com/player/"))
            const rendered = await Promise.all(widgets.map((f) =>
                f.waitForSelector(".playButton", { state: "visible", timeout: 10000 }).then(() => true, () => false)))
            const expected = (await h.iframes(s.root)).length
            if (rendered.filter(Boolean).length < expected) {
                throw new Error(`${s.name}: ${rendered.filter(Boolean).length}/${expected} SoundCloud widgets rendered`)
            }
            await h.page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "start" }), s.root)
            await h.wait(500)
            const m =await measure(s.root, s.slot)
            const tag = `${s.name} ${wide ? "wide" : "narrow"}`
            if (!near(m.player.h, s.playerHeight, 20)) throw new Error(`${tag}: player height ${m.player.h}, expected ~${s.playerHeight}`)
            if (m.title.y < m.player.bottom - 1) throw new Error(`${tag}: title is not below the player`)
            if (wide) {
                if (m.player.x < m.art.right - 1) throw new Error(`${tag}: player is not right of the artwork`)
                if (!near(m.player.y, m.art.y, 2)) throw new Error(`${tag}: player top ${m.player.y} != artwork top ${m.art.y}`)
                if (m.title.x < m.art.right - 1) throw new Error(`${tag}: title is not in the right column`)
            } else {
                if (m.player.y < m.art.bottom - 1) throw new Error(`${tag}: player is not below the artwork`)
            }
            if (m.slot) {
                if (m.slot.y < Math.max(m.art.bottom, m.title.bottom) - 1) throw new Error(`${tag}: slot content overlaps the columns`)
                if (m.slot.x > m.art.x + 40) throw new Error(`${tag}: slot content is not full width (x=${m.slot.x})`)
            }
            await h.page.locator(s.root).screenshot({ path: path.join(outDir, `${s.name}-${wide ? "wide" : "narrow"}.png`) })
            // Element screenshots taller than the viewport leave off-screen
            // iframes unpainted, so also capture the viewport at the slot players.
            const slotPlayer = s.slot && await h.page.$(`${s.root} ${s.slot} iframe`)
            if (slotPlayer) {
                await slotPlayer.scrollIntoViewIfNeeded()
                await h.wait(1500)
                await h.page.screenshot({ path: path.join(outDir, `${s.name}-players-${wide ? "wide" : "narrow"}.png`) })
            }
        }
    }
    await h.page.setViewportSize(VIEWPORT)
}

// ---------------------------------------------------------------------------

// --- check: legacyHashRedirect ---
// A fresh load of a legacy hash URL lands on the equivalent history-mode path:
// the hash is gone and the router's first navigation targets that path. The
// app has no /releases route, so /albums stands in; on a fresh load the router
// guard sends the uninitialized app to "/", recorded in redirectedFrom.
// It opens its own page because the check needs a fresh load, which gotoRoute
// on the already-initialized main page cannot give.
checks.legacyHashRedirect = async (h) => {
    const page = await h.page.context().newPage()
    try {
        await page.goto(`${baseUrl}/#/albums?scroll=true`, { waitUntil: "domcontentloaded" })
        const state = await page.waitForFunction(() => {
            const app = document.querySelector("#app").__vue_app__
            const route = app && app.config.globalProperties.$router.currentRoute.value
            if (!route || route.matched.length === 0) return null
            return { hash: location.hash, from: route.redirectedFrom ? route.redirectedFrom.fullPath : null }
        }, null, { timeout: 30000 }).then((handle) => handle.jsonValue())
        if (state.hash !== "") throw new Error(`hash still present: ${state.hash}`)
        if (state.from !== "/albums?scroll=true") throw new Error(`first navigation was ${state.from}, expected /albums?scroll=true`)
    } finally {
        await page.close()
    }
}

// --- check: tabIdentity ---
// The tab reads "Ludik" on every route and both linked icons decode as images.
// Decoding matters: the SPA fallback answers 200 with HTML for a missing file.
checks.tabIdentity = async (h) => {
    for (const route of ["/", "/albums"]) {
        await h.gotoRoute(route)
        const title = await h.page.title()
        if (title !== "Ludik") throw new Error(`${route}: title is ${JSON.stringify(title)}`)
    }
    const icons = await h.page.$$eval('link[rel="icon"]', (links) => Promise.all(links.map(async (link) => {
        const img = new Image()
        img.src = link.href
        const decoded = await img.decode().then(() => true, () => false)
        return { path: new URL(link.href).pathname, decoded }
    })))
    const paths = icons.map((icon) => icon.path).join(" ")
    if (paths !== "/favicon.ico /favicon.svg") throw new Error(`linked icons are ${JSON.stringify(paths)}`)
    const broken = icons.filter((icon) => !icon.decoded).map((icon) => icon.path)
    if (broken.length) throw new Error(`not an image: ${broken.join(", ")}`)
}

;(async () => {
    const consoleLines = []
    const results = []
    // Headless Chromium falls back to software WebGL, which pegs every CPU
    // core; on macOS these flags keep WebGL on the GPU through Metal.
    const gpuArgs = process.platform === "darwin"
        ? ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
        : []
    const browser = await chromium.launch({ headless: !headed, args: gpuArgs })
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    await context.addInitScript(stubPointerLock)
    // Context-level listeners also capture pages that checks open themselves
    context.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`))
    context.on("weberror", (err) => consoleLines.push(`[pageerror] ${err.error().message}`))
    const page = await context.newPage()

    try {
        await passGate(page)
        const h = helpers(page)
        const runChecks = async (group) => {
            for (const [name, fn] of Object.entries(group)) {
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
        }
        await runChecks(worldChecks)
        await enterHomeViaStargate(page)
        await runChecks(checks)
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
