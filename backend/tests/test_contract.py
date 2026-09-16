from app.ml.constants import IMAGE_SIZE, LABELS


def test_notebook_contract() -> None:
    assert IMAGE_SIZE == 320
    assert len(LABELS) == 14
    assert LABELS[0] == "No Finding"
    assert LABELS[-1] == "Support Devices"


def test_fastapi_routes_register() -> None:
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/health" in paths
    assert "/api/analyze" in paths
    assert "/api/reports/{report_id}" in paths
