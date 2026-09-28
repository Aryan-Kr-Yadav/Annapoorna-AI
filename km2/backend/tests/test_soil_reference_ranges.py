from app.data.soil_reference_ranges import rate_nitrogen, rate_organic_carbon, rate_ph, rate_phosphorus, rate_potassium


def test_ph_ratings():
    assert rate_ph(5.0) == "Acidic (Low)"
    assert rate_ph(6.8) == "Normal"
    assert rate_ph(8.0) == "Alkaline (High)"
    assert rate_ph(None) == "Unknown"


def test_nitrogen_phosphorus_potassium_ratings():
    assert rate_nitrogen(100) == "Low"
    assert rate_phosphorus(15) == "Normal"
    assert rate_potassium(300) == "High"


def test_organic_carbon_rating():
    assert rate_organic_carbon(0.3) == "Low"
    assert rate_organic_carbon(0.6) == "Normal"
