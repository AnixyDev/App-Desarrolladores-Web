import React from 'react';
// FIX: Added .tsx extension to the import path.
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
// FIX: Add .tsx extension to Icon import
import { MailIcon } from '../components/icons/Icon.tsx';

const ProfilePublic: React.FC = () => {
    const { profile } = useAppStore();

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
                        <p className="text-xl text-primary-400">{profile.business_name}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                        <MailIcon className="w-5 h-5 text-gray-400" />
                        <a href={`mailto:${profile.email}`} className="text-gray-300 hover:text-white">{profile.email}</a>
                    </div>
                    {/* Add more profile details as needed */}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePublic;