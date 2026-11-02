const slug = process.argv[2];
(async () => {
  const r = await fetch('http://127.0.0.1:8088/api/v1/plugins/public-session/form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_slug: slug, ref: 'contact-requests' }),
  });
  console.log(slug, r.status, JSON.stringify(await r.json()).slice(0, 400));
})();
