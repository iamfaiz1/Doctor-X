# Grad-CAM

Grad-CAM highlights input regions that most influenced one selected model output. It is an attention visualization, not a lesion segmentation or clinical finding.

## Current model

The registered model is `densenet121_chexpert`, using the final Kaggle DenseNet-121 architecture and checkpoint. Its adapter resolves `model.features` as the target layer. This module ends in DenseNet's `norm5` layer and is the final spatial feature map before ReLU and global average pooling, as verified in `densenet-10k-fixed.ipynb`.

The service reuses the predictioen pipeline's RGB conversion, direct 320x320 resize, tensor conversion, and ImageNet normalization. It scores the selected multi-label **logit**, then reports that class's sigmoid probability.

## Design

`app/ml/explainability/gradcam.py` is architecture-agnostic. It receives the loaded model, its input tensor, a target index, and an injected convolutional target layer. It has no model import or checkpoint handling. A temporary forward hook retains activations and is removed after every request. Gradients are required only for Grad-CAM; prediction continues to use inference mode.

`app/ml/explainability/registry.py` contains model-specific adapters. The registry maps a model identifier to a target-layer resolver. The same loaded model instance used for prediction is passed into Grad-CAM; no second model or Grad-CAM weights exist.

## API output

`POST /api/explain` returns PNG data URIs for the original image, class-specific heatmap, and overlay. The visualization images preserve the original image dimensions, while the tensor sent to the model remains 320x320.

Zero-activation regions are transparent in the overlay, preserving the radiograph instead of globally tinting it blue. When the selected class has no positive localized Grad-CAM evidence, `has_positive_evidence` is `false`, the overlay is returned unchanged, and `message` explains this rather than presenting a misleading heatmap.

## Add a CNN model

1. Add its normal model construction/loading entry.
2. Register a `ModelExplanationConfig` with a model identifier, a verified target convolutional/spatial layer name, and a resolver in `registry.py`.
3. Select that registry entry in the inference service.

The generic Grad-CAM implementation does not change.

## Replace a DenseNet checkpoint

Set `MODEL_PATH` to the new `.pth` and restart the service. No Grad-CAM code changes are required when the new checkpoint retains the exact DenseNet-121 architecture, 14 output order, and preprocessing. If any of those change, update the architecture/configuration deliberately; checkpoint loading will fail clearly for incompatible state dictionaries.
