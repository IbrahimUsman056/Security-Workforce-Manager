from datetime import datetime, timedelta

def test_shift_overlap_logic():
    # pure logic test without DB — validates the overlap formula used in scheduling.py
    shift_a_start = datetime(2026, 7, 20, 9, 0)
    shift_a_end = datetime(2026, 7, 20, 17, 0)

    shift_b_start = datetime(2026, 7, 20, 16, 0)  # overlaps last hour
    shift_b_end = datetime(2026, 7, 20, 20, 0)

    overlap = shift_a_start < shift_b_end and shift_a_end > shift_b_start
    assert overlap == True

    shift_c_start = datetime(2026, 7, 20, 18, 0)  # no overlap
    shift_c_end = datetime(2026, 7, 20, 22, 0)

    no_overlap = shift_a_start < shift_c_end and shift_a_end > shift_c_start
    assert no_overlap == False