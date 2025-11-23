import { useState } from 'react';
import './SimpleImageUpload.css';

export default function SimpleImageUpload({ selectedImages, onImagesChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remainingSlots = maxImages - selectedImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(`Maksymalnie ${maxImages} zdjec`);
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      filesToUpload.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:3001/api/gallery/upload-multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const uploadedImages = await response.json();
        const imageUrls = uploadedImages.map(img => `http://localhost:3001${img.file_path}`);
        onImagesChange([...selectedImages, ...imageUrls]);
      } else {
        alert('Nie udalo sie uploadowac zdjec');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Blad uploadu zdjec');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...selectedImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="simple-image-upload">
      {selectedImages.length < maxImages && (
        <div className="upload-button-container">
          <label className="upload-button">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? 'Uploading...' : `+ Wybierz zdjecia (${selectedImages.length}/${maxImages})`}
          </label>
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className="selected-images-grid">
          {selectedImages.map((url, index) => (
            <div key={index} className="image-preview-card">
              <img src={url} alt={`Zdjecie ${index + 1}`} />
              {index === 0 && <span className="primary-badge">Glowne</span>}
              <div className="image-controls">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="btn-move"
                    title="Przesuń w lewo"
                  >
                    ←
                  </button>
                )}
                {index < selectedImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="btn-move"
                    title="Przesuń w prawo"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="btn-remove"
                  title="Usuń"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImages.length > 0 && (
        <small className="help-text">
          Pierwsze zdjecie bedzie zdjęciem głównym produktu
        </small>
      )}
    </div>
  );
}
