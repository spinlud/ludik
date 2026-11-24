// Builds a compact SoundCloud widget player URL for an api.soundcloud.com
// resource, e.g. soundcloudPlayerSrc("playlists/687008079").
export function soundcloudPlayerSrc (resource) {
    const url = encodeURIComponent(`https://api.soundcloud.com/${resource}`)
    return `https://w.soundcloud.com/player/?visual=false&url=${url}&show_artwork=true`
}
