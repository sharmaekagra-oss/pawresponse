export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          // Nominatim's usage policy asks for an identifying User-Agent on server-side requests.
          "User-Agent": "PawResponse-ClassProject/1.0",
        },
      },
    );
    const results: { lat: string; lon: string }[] = await res.json();
    if (!results[0]) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
