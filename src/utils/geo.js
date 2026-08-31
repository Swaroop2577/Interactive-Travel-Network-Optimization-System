
export const haversineDistance = (coord1, coord2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};


export const geocodeCity = async (cityName) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    cityName
  )}&limit=1`;

  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!response.ok) throw new Error('Geocoding request failed');

  const data = await response.json();
  if (!data.length) throw new Error(`City "${cityName}" not found`);

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
};