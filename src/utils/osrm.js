

const OSRM_BASE = 'https://router.project-osrm.org';


export const getDrivingMatrix = async (nodes) => {

  const coords = nodes.map((n) => `${n.lng},${n.lat}`).join(';');
  const url = `${OSRM_BASE}/table/v1/driving/${coords}?annotations=distance,duration`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('OSRM request failed');

  const data = await response.json();
  if (data.code !== 'Ok') throw new Error(`OSRM error: ${data.code}`);

  
  return nodes.map((_, i) =>
    nodes.map((_, j) => {
      const distMeters = data.distances?.[i]?.[j];
      const durSeconds = data.durations?.[i]?.[j];
      if (distMeters == null || durSeconds == null) return null;
      return {
        distanceKm: Math.round(distMeters / 1000),
        durationHours: +(durSeconds / 3600).toFixed(1),
      };
    })
  );
};