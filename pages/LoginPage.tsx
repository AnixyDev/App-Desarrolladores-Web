import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is likely deprecated. Redirecting to the correct auth path.
const DeprecatedLoginPage: React.FC = () => {
    return <Navigate to="/auth/login" replace />;
};

export default DeprecatedLoginPage;
