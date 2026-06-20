import { cache } from "./redis";


export async function geocodeLocation(location){

    const cacheKey = `geocode:${location.toLowerCase()}`;

    // Try cache first
    const cachedGeometry = await cache.get(cacheKey);

    if (cachedGeometry){
        console.log('Geocoding cache HIT', location);
        return cachedGeometry;
    }

    console.log('Geododing cache MISS', location);

    try {
        console.log("MAPBOX API CALLED for:", location);
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
        );

        const data = await response.json();

        const geometry =
            data.features && data.features.length > 0
                ? {
                      type: 'Point',
                      coordinates: data.features[0].geometry.coordinates, // [lng, lat]
                  }
                : {
                      type: 'Point',
                      coordinates: [0, 0],
                  };

        // Cache geocoding result for 30 days (2592000 seconds)
        await cache.set(cacheKey, geometry, 2592000);

        return geometry;


    } catch (error) {
        console.error('Geocoding error:', error);
        return {
            type: 'Point',
            coordinates: [0,0],
        };
    }
}