from geopy.distance import geodesic

def is_within_geofence(site_lat: float, site_lng: float, user_lat: float, user_lng: float, radius_m: int) -> bool:
    distance = geodesic((site_lat, site_lng), (user_lat, user_lng)).meters
    return distance <= radius_m