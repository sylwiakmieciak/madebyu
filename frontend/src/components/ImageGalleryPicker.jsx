import { useState, useEffect } from 'react';
import './ImageGalleryPicker.css';

export default function ImageGalleryPicker({ selectedImages, onImagesChange, maxImages = 5 }) {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/gallery', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setGallery(data);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      files.forEach(file => {
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
        await loadGallery();
        setShowUpload(false);
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleImageSelection = (image) => {
    const imageUrl = `http://localhost:3001${image.file_path}`;
    const isSelected = selectedImages.includes(imageUrl);

    if (isSelected) {
      onImagesChange(selectedImages.filter(url => url !== imageUrl));
    } else {
      if (selectedImages.length < maxImages) {
        onImagesChange([...selectedImages, imageUrl]);
      }
    }
  };

  const removeSelectedImage = (index) => {
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
    <div className="gallery-picker">
      <div className="gallery-header">
        <h3>Wybierz zdjecia z galerii</h3>
        <button
          type="button"
          className="btn-upload"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Anuluj' : '+ Upload nowe'}
        </button>
      </div>

      {showUpload && (
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="file-input"
          />
          {uploading && <p className="upload-status">Uploading...</p>}
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className="selected-images">
          <h4>Wybrane zdjecia ({selectedImages.length}/{maxImages})</h4>
          <div className="selected-grid">
            {selectedImages.map((url, index) => (
              <div key={index} className="selected-image-card">
                <img src={url} alt={`Selected ${index + 1}`} />
                {index === 0 && <span className="primary-badge">Glowne</span>}
                <div className="selected-controls">
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
                    onClick={() => removeSelectedImage(index)}
                    className="btn-remove"
                    title="Usuń"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <small className="help-text">Pierwsze zdjecie bedzie zdjęciem głównym produktu. Przeciągnij aby zmienić kolejność.</small>
        </div>
      )}

      <div className="gallery-grid">
        {loading ? (
          <p className="gallery-loading">Ladowanie galerii...</p>
        ) : gallery.length === 0 ? (
          <p className="gallery-empty">Brak zdjec w galerii. Upload pierwsze zdjecia!</p>
        ) : (
          gallery.map(image => {
            const imageUrl = `http://localhost:3001${image.file_path}`;
            const isSelected = selectedImages.includes(imageUrl);
            
            return (
              <div
                key={image.id}
                className={`gallery-image ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleImageSelection(image)}
              >
                <img src={imageUrl} alt={image.alt_text || image.original_name} />
                {isSelected && (
                  <div className="selected-overlay">
                    <span className="check-icon">✓</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
