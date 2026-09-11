"""Constants copied exactly from the authoritative Kaggle notebook."""

LABELS = (
    "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
    "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
    "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices",
)
IMAGE_SIZE = 320
NORMALIZATION_MEAN = (0.485, 0.456, 0.406)
NORMALIZATION_STD = (0.229, 0.224, 0.225)
MODEL_NAME = "DenseNet-121 CheXpert"
MODEL_VERSION = "10k-fixed"
