// The Sakuga VFX web components live in public/sakuga-vfx as plain scripts.
// Load each one once, the first time something on screen needs it.
const requested = new Set();

export function loadSakuga(...names) {
  names.forEach((name) => {
    if (requested.has(name) || customElements.get(`sakuga-${name}`)) return;
    requested.add(name);
    const script = document.createElement('script');
    script.src = `/sakuga-vfx/${name}.js`;
    script.async = true;
    document.head.appendChild(script);
  });
}
