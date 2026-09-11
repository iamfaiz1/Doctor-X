import torch
from torch import nn

from app.ml.explainability.gradcam import GradCAM


class TinyMultiLabelCNN(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Conv2d(3, 4, kernel_size=3, padding=1)
        self.classifier = nn.Linear(4, 2)

    def forward(self, tensor: torch.Tensor) -> torch.Tensor:
        features = torch.relu(self.features(tensor))
        return self.classifier(features.mean(dim=(2, 3)))


def test_gradcam_is_generic_and_class_specific() -> None:
    torch.manual_seed(7)
    model = TinyMultiLabelCNN().eval()
    image = torch.rand(1, 3, 16, 16)

    first = GradCAM(model, model.features).generate(image, 0)
    second = GradCAM(model, model.features).generate(image, 1)

    assert first.heatmap.shape == (16, 16)
    assert first.heatmap.min() >= 0 and first.heatmap.max() <= 1
    assert not torch.equal(first.logits, torch.empty(0))
    assert not (first.heatmap == second.heatmap).all()
