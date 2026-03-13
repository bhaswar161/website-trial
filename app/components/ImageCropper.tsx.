"use client";
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageCropper({ image, onCropComplete, onCancel }: any) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: any) => setZoom(zoom);

  const handleCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '400px', background: '#333', borderRadius: '15px', overflow: 'hidden' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1} // 1:1 Square aspect ratio for profile pics
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={handleCropComplete}
        />
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '10px', background: '#ff4757', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
        <button 
          onClick={() => onCropComplete(croppedAreaPixels)} 
          style={{ padding: '10px 20px', borderRadius: '10px', background: '#6c63ff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Crop & Save
        </button>
      </div>
      <input 
        type="range" 
        min={1} max={3} step={0.1} 
        value={zoom} 
        onChange={(e) => setZoom(Number(e.target.value))}
        style={{ marginTop: '20px', width: '200px' }}
      />
    </div>
  );
}