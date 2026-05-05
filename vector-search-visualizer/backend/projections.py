import numpy as np
from sklearn.decomposition import PCA

def project_to_3d(vectors: np.ndarray) -> dict:
    n_samples = vectors.shape[0]
    n_components = min(3, n_samples, vectors.shape[1])

    if n_samples < 2:
        # Can't do PCA with 1 sample; just take first 3 dims
        v3d = vectors[:, :3] if vectors.shape[1] >= 3 else np.pad(vectors, ((0, 0), (0, 3 - vectors.shape[1])))
        return {
            "vectors_3d": v3d.tolist(),
            "explained_variance": [0.0, 0.0, 0.0],
        }

    pca = PCA(n_components=n_components)
    projected = pca.fit_transform(vectors)

    # Pad to 3D if fewer components
    if n_components < 3:
        pad = np.zeros((n_samples, 3 - n_components))
        projected = np.concatenate([projected, pad], axis=1)

    explained = pca.explained_variance_ratio_.tolist()
    while len(explained) < 3:
        explained.append(0.0)

    return {
        "vectors_3d": projected.tolist(),
        "explained_variance": explained,
    }
