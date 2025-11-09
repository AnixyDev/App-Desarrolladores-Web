import React, { useRef, useMemo } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { Paperclip, Upload, Trash2 } from '../icons/Icon';
import Button from '../ui/Button';

interface FileListProps {
  entityId: string;
  currentUser: {
    name: string;
  };
}

const FileList: React.FC<FileListProps> = ({ entityId, currentUser }) => {
    const { portalFiles, addPortalFile, deletePortalFile } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const files = useMemo(() => {
        return portalFiles.filter(f => f.entityId === entityId);
    }, [portalFiles, entityId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            addPortalFile({
                entityId,
                fileName: file.name,
                fileType: file.type,
                url: '#', // In a real app, this would be a URL from a storage service
                uploadedBy: currentUser.name,
            });
        }
    };

    return (
        <div className="h-full">
            <h4 className="font-semibold text-slate-300 mb-3">Archivos Adjuntos</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto bg-slate-900/50 p-3 rounded-lg">
                {files.length > 0 ? files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-white">{file.fileName}</p>
                            <p className="text-xs text-slate-400">Subido por {file.uploadedBy}</p>
                        </div>
                        <Button size="sm" variant="danger" onClick={() => deletePortalFile(file.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No hay archivos adjuntos.</p>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full mt-4">
                <Upload className="w-4 h-4 mr-2" /> Subir Archivo
            </Button>
        </div>
    );
};

export default FileList;
