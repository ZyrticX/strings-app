import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageIcon, VideoIcon, Upload, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { notifyMediaUploaded } from '@/utils/notificationManager';

// Image compression utility
const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// File validation
const validateFile = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (file.size > maxSize) {
    return { valid: false, error: `הקובץ גדול מדי. מקסימום 50MB` };
  }
  
  const isImage = allowedImageTypes.includes(file.type);
  
  if (!isImage) {
    return { valid: false, error: 'סוג קובץ לא נתמך. רק תמונות (JPG, PNG, WEBP, GIF)' };
  }
  
  return { valid: true, type: 'image' };
};

const MediaUploadOptimized = ({ eventId, onUploadSuccess, allowVideo = true, maxFiles = 10 }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleFileSelect = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const newUploads = [];
    const newErrors = [];

    if (files.length + uploadQueue.length > maxFiles) {
      newErrors.push(`ניתן להעלות מקסימום ${maxFiles} קבצים בכל פעם`);
      setErrors(newErrors);
      return;
    }

    for (const file of files) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        newErrors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      
      // Video uploads are disabled system-wide
      // This check is no longer needed since validation only allows images

      let processedFile = file;
      
      // Compress images
      if (validation.type === 'image') {
        try {
          processedFile = await compressImage(file);
          processedFile.name = file.name; // Preserve original name
        } catch (error) {
          console.error('Image compression failed:', error);
          // Use original file if compression fails
        }
      }

      newUploads.push({
        id: Math.random().toString(36).substr(2, 9),
        file: processedFile,
        originalFile: file,
        type: validation.type,
        status: 'pending',
        progress: 0,
        error: null
      });
    }

    setUploadQueue(prev => [...prev, ...newUploads]);
    setErrors(newErrors);
    
    // Clear file input
    event.target.value = '';
  }, [allowVideo, maxFiles, uploadQueue.length]);

  const removeFromQueue = useCallback((id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const startUpload = useCallback(async () => {
    if (uploadQueue.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const pendingUploads = uploadQueue.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingUploads.length; i++) {
      const upload = pendingUploads[i];
      
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(item => 
          item.id === upload.id ? { ...item, status: 'uploading' } : item
        ));
        
        // Upload file
        const result = await UploadFile({ file: upload.file });
        
        // Update status to success
        setUploadQueue(prev => prev.map(item => 
          item.id === upload.id ? { ...item, status: 'success', uploadedUrl: result.file_url } : item
        ));
        
        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess({
            file_url: result.file_url,
            file_type: upload.type,
            original_name: upload.originalFile.name
          });
        }
        
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadQueue(prev => prev.map(item => 
          item.id === upload.id ? { ...item, status: 'error', error: error.message } : item
        ));
      }
      
      // Update overall progress
      setUploadProgress(((i + 1) / pendingUploads.length) * 100);
    }
    
    setIsUploading(false);
    
    // Remove successful uploads after 2 seconds
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'success'));
    }, 2000);
  }, [uploadQueue, onUploadSuccess]);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
    setErrors([]);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Upload className="w-4 h-4 text-gray-500" />;
      case 'uploading': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* File Input */}
      <div className="flex items-center gap-4">
        <label className="flex-1">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-2 border-dashed border-bordeaux/30 hover:border-bordeaux/50 text-bordeaux hover:bg-bordeaux/5"
            disabled={isUploading}
          >
            <Upload className="w-5 h-5 ml-2" />
            בחר קבצים להעלאה
          </Button>
        </label>
        
        {uploadQueue.length > 0 && (
          <Button
            onClick={clearQueue}
            variant="outline"
            size="sm"
            disabled={isUploading}
          >
            נקה הכל
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">קבצים להעלאה ({uploadQueue.length})</h3>
            <Button
              onClick={startUpload}
              disabled={isUploading || uploadQueue.every(item => item.status !== 'pending')}
              className="btn-bordeaux"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  התחל העלאה
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {Math.round(uploadProgress)}% הושלם
              </p>
            </div>
          )}

          {/* File List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  {upload.type === 'image' ? (
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <VideoIcon className="w-5 h-5 text-purple-500" />
                  )}
                  {getStatusIcon(upload.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.originalFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.originalFile.size)}
                    {upload.file !== upload.originalFile && upload.type === 'image' && (
                      <span className="text-green-600"> → {formatFileSize(upload.file.size)} (דחוס)</span>
                    )}
                  </p>
                  {upload.error && (
                    <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                  )}
                </div>
                
                <Button
                  onClick={() => removeFromQueue(upload.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isUploading && upload.status === 'uploading'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">הנחיות העלאה:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>תמונות יידחסו אוטומטית לשיפור מהירות ההעלאה</li>
          <li>גודל מקסימלי: 50MB לקובץ</li>
          <li>פורמטים נתמכים: JPG, PNG, WEBP, GIF</li>
          <li>מקסימום {maxFiles} קבצים בכל פעם</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploadOptimized;