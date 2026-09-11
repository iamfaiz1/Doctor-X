from app.ml.constants import IMAGE_SIZE, LABELS


def test_notebook_contract() -> None:
    assert IMAGE_SIZE == 320
    assert len(LABELS) == 14
    assert LABELS[0] == "No Finding"
    assert LABELS[-1] == "Support Devices"
