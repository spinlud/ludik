// Builds a SoundCloud widget player URL for an api.soundcloud.com resource,
// e.g. soundcloudPlayerSrc("playlists/687008079").
// `visual` selects the large artwork player; otherwise the compact classic player.
export function soundcloudPlayerSrc (resource, { visual = true } = {}) {
    const url = encodeURIComponent(`https://api.soundcloud.com/${resource}`)
    return `https://w.soundcloud.com/player/?visual=${visual}&url=${url}&show_artwork=true`
}
