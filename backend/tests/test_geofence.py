from app.services.geofence import is_within_geofence

def test_within_geofence():
    # same coordinates, distance = 0
    assert is_within_geofence(30.1575, 71.5249, 30.1575, 71.5249, 150) == True

def test_outside_geofence():
    # far apart coordinates
    assert is_within_geofence(30.1575, 71.5249, 0.0, 0.0, 150) == False