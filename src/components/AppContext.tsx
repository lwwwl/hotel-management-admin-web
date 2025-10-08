import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webApi } from '../api';
import type { UserWebInfo, RouterInfo } from '../api';

interface ApiResponse<T> {
    timestamp: number;
    statusCode: number;
    message: string;
    data: T;
    error: string | null;
}

interface AppContextType {
    userInfo: UserWebInfo | null;
    routers: RouterInfo[];
    loading: boolean;
    error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [userInfo, setUserInfo] = useState<UserWebInfo | null>(null);
    const [routers, setRouters] = useState<RouterInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Starting data fetch...");
            try {
                console.log("Fetching user info...");
                const userInfoResponse = await webApi.getUserInfo();
                console.log("User info response received:", userInfoResponse);

                if (userInfoResponse.status === 200 && userInfoResponse.data) {
                    const apiResponse = userInfoResponse.data as unknown as ApiResponse<UserWebInfo>;
                    if (apiResponse.statusCode === 200 && apiResponse.data) {
                        setUserInfo(apiResponse.data);
                        console.log("User info state updated successfully.");
                    } else {
                        throw new Error(apiResponse.message || 'Failed to process user info data');
                    }
                } else {
                    throw new Error('Received an invalid response object for user info');
                }
                
                console.log("Fetching routers...");
                const routersResponse = await webApi.getRouters();
                console.log("Routers response received:", routersResponse);

                if (routersResponse.status === 200 && routersResponse.data) {
                    const apiResponse = routersResponse.data as unknown as ApiResponse<RouterInfo[]>;
                    if (apiResponse.statusCode === 200 && apiResponse.data) {
                        setRouters(apiResponse.data);
                        console.log("Routers state updated successfully.");
                    } else {
                        throw new Error(apiResponse.message || 'Failed to process routers data');
                    }
                } else {
                    throw new Error('Received an invalid response object for routers');
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error("An error occurred during data fetching:", errorMessage, err);
                setError(errorMessage);
            } finally {
                setLoading(false);
                console.log("Data fetching finished.");
            }
        };

        fetchData();
    }, []);

    const value = { userInfo, routers, loading, error };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
