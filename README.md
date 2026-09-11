# Doctor-X backend

Inference-only FastAPI backend for the final Kaggle CheXpert DenseNet-121 checkpoint. It faithfully uses the notebook's RGB resize to 320×320, ImageNet normalization, 14 output labels in notebook order, and sigmoid multi-label interpretation.

## Run

1. `cd backend`, then create and activate a Python virtual environment.
2. Install `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and place the final Kaggle file at `models/densenet121_chexpert.pth` (or set `MODEL_PATH`).
4. Run `uvicorn app.main:app --reload`.

The process eagerly loads the checkpoint once at startup, uses CUDA when available (otherwise CPU), enters evaluation mode, and never downloads, trains, or changes model weights. By default startup fails clearly if the checkpoint is missing. `REQUIRE_MODEL_ON_STARTUP=false` is only for API-only development.

Open `/docs` for the interactive contract, or see [API documentation](docs/API.md).
