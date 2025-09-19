import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Cloud, CheckCircle, AlertTriangle, Loader2, Copy } from 'lucide-react';

const GoogleDriveBackup = ({ mediaItems, eventName }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatus, setBackupStatus] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState([]);

  const generateDownloadLinks = async () => {
    if (mediaItems.length === 0) {
      setBackupStatus({ type: 'error', message: 'אין מדיה לגיבוי' });
      return;
    }

    setIsBackingUp(true);
    setBackupProgress(0);
    setBackupStatus(null);
    setDownloadLinks([]);

    try {
      const links = [];
      
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        
        // Create a structured download link with metadata
        const linkData = {
          url: item.file_url,
          filename: `${i + 1}_${item.uploader_name || 'unknown'}_${item.caption || 'media'}.${item.file_type === 'image' ? 'jpg' : 'mp4'}`,
          type: item.file_type,
          uploader: item.uploader_name,
          caption: item.caption,
          index: i + 1
        };
        
        links.push(linkData);
        
        // Update progress
        setBackupProgress(((i + 1) / mediaItems.length) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setDownloadLinks(links);
      setBackupStatus({ 
        type: 'success', 
        message: `נוצרו ${mediaItems.length} קישורי הורדה. גלול למטה לראות את כל הקישורים.` 
      });

    } catch (error) {
      console.error('Backup preparation failed:', error);
      setBackupStatus({ 
        type: 'error', 
        message: 'שגיאה ביצירת קישורי הגיבוי. נסה שוב או צור קשר לתמיכה.' 
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const downloadAllFiles = async () => {
    for (const link of downloadLinks) {
      try {
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = link.url;
        a.download = link.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${link.filename}:`, error);
      }
    }
  };

  const copyLinksToClipboard = () => {
    const linksText = downloadLinks.map(link => 
      `${link.filename}\n${link.url}\n---`
    ).join('\n');
    
    navigator.clipboard.writeText(linksText).then(() => {
      setBackupStatus({ 
        type: 'info', 
        message: 'קישורי ההורדה הועתקו ללוח. ניתן להדביק אותם בכל מקום נוח.' 
      });
    }).catch(() => {
      setBackupStatus({ 
        type: 'error', 
        message: 'לא ניתן להעתיק ללוח. השתמש בלחצן הורדה ידנית.' 
      });
    });
  };

  const getStatusIcon = () => {
    if (!backupStatus) return null;
    
    switch (backupStatus.type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'info': return <Cloud className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-4">
        <Button
          onClick={generateDownloadLinks}
          disabled={isBackingUp || mediaItems.length === 0}
          className="btn-bordeaux flex-1"
        >
          {isBackingUp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              מכין גיבוי...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 ml-2" />
              הכן גיבוי של כל המדיה ({mediaItems.length} קבצים)
            </>
          )}
        </Button>
      </div>

      {isBackingUp && (
        <div className="space-y-2">
          <Progress value={backupProgress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">
            מכין את קישורי ההורדה... {Math.round(backupProgress)}%
          </p>
        </div>
      )}

      {backupStatus && (
        <Alert variant={backupStatus.type === 'error' ? 'destructive' : 'default'}>
          {getStatusIcon()}
          <AlertDescription className="mr-2">
            {backupStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {downloadLinks.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={downloadAllFiles}
              className="btn-bordeaux flex-1"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד את כל הקבצים ({downloadLinks.length})
            </Button>
            <Button
              onClick={copyLinksToClipboard}
              variant="outline"
              className="flex-shrink-0"
            >
              <Copy className="w-4 h-4 ml-2" />
              העתק קישורים
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">קישורי הורדה ({downloadLinks.length} קבצים):</h3>
              <div className="space-y-3">
                {downloadLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{link.filename}</p>
                      <p className="text-xs text-gray-500">
                        {link.uploader && `מעלה: ${link.uploader}`}
                        {link.caption && ` | כיתוב: ${link.caption}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = link.url;
                        a.download = link.filename;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">הוראות גיבוי לגוגל דרייב:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>לחץ על "הכן גיבוי" ואז על "הורד את כל הקבצים"</li>
          <li>כל הקבצים יישמרו בתיקיית ההורדות במחשב</li>
          <li>פתח את drive.google.com וצור תיקייה חדשה</li>
          <li>גרור את כל הקבצים מתיקיית ההורדות לתיקייה בגוגל דרייב</li>
          <li>לחלופין - השתמש ב"העתק קישורים" ושמור את הרשימה</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleDriveBackup;