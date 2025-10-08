import api from './axiosConfig';

// Define the response types based on the backend BOs

interface DeptInfo {
    deptId: number;
    deptName: string;
}

interface UserInfo {
    id: number;
    username: string;
    displayName: string;
    employeeNumber: string;
    email: string;
    phone: string;
    dept: DeptInfo;
}

interface RoleInfo {
    id: number;
    name: string;
    description: string;
}

export interface UserWebInfo {
    permissions: string[];
    roles: RoleInfo[];
    user: UserInfo;
}

export interface RouterInfo {
    path: string;
    name: string;
    component: string;
    perms: string;
    icon: string;
    sortOrder: number;
    active: boolean;
    children: RouterInfo[];
}


export const webApi = {
    /**
     * Get current user's information
     */
    getUserInfo: async () => {
        return await api.get<UserWebInfo>('/web/getUserInfo');
    },

    /**
     * Get all routers
     */
    getRouters: async () => {
        return await api.get<RouterInfo[]>('/web/getRouter');
    },
};
