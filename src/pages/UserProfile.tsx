import React, { useState, useEffect } from 'react';
import { useAppContext } from '../components/AppContext';
import { userApi } from '../api';
import { useToast } from '../components/ToastProvider';
import { User, Mail, Phone, Save, KeyRound, Building2 } from 'lucide-react';

const UserAvatar = ({ displayName, size = 'large' }: { displayName: string, size?: 'small' | 'large' }) => {
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const sizeClasses = {
        large: 'w-20 h-20 text-3xl',
        small: 'w-10 h-10 text-lg'
    };
    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 50%)`;
    };
    return (
        <div
            className={`rounded-full flex items-center justify-center text-white font-medium ${sizeClasses[size]}`}
            style={{ backgroundColor: getColor(displayName || '') }}
        >
            {firstLetter}
        </div>
    );
};


const UserProfile = () => {
    const { userInfo, loading } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ displayName: '', phone: '', email: '' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const showToast = useToast();

    useEffect(() => {
        if (userInfo?.user) {
            setFormData({
                displayName: userInfo.user.displayName,
                phone: userInfo.user.phone || '',
                email: userInfo.user.email || '',
            });
        }
    }, [userInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        try {
            const result = await userApi.updateUserBasic({
                displayName: formData.displayName,
                phone: formData.phone,
                email: formData.email,
            });
            if (result.statusCode === 200) {
                showToast('用户信息更新成功', 'success');
                setIsEditing(false);
                // In a real app, you would refetch or update the context here
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showToast(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
        }
    };

    if (loading || !userInfo) {
        return <div className="p-8">Loading...</div>;
    }

    const { user, roles } = userInfo;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 text-left">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">个人资料</h1>
                    <p className="mt-2 text-gray-600">查看和管理您的账户信息。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Left Panel: Avatar and Name */}
                    <aside className="w-1/4">
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
                            <UserAvatar displayName={user.displayName} />
                            <h2 className="text-xl font-bold mt-4">{user.displayName}</h2>
                            <p className="text-gray-500">{user.username}</p>
                        </div>
                    </aside>

                    {/* Right Panel: Details and Actions */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-md p-8">
                        {/* Profile Details Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-left">个人资料</h2>
                                <p className="text-sm text-gray-500 mt-1 text-left">更新您的个人信息和联系方式。</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <ProfileRow label="显示名称">
                                    {isEditing ? (
                                        <input name="displayName" value={formData.displayName} onChange={handleInputChange} className="form-input" />
                                    ) : (
                                        <span className="text-gray-800">{formData.displayName}</span>
                                    )}
                                </ProfileRow>
                                <ProfileRow label="邮箱地址">
                                     {isEditing ? (
                                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="form-input" />
                                    ) : (
                                        <span className="text-gray-800">{formData.email}</span>
                                    )}
                                </ProfileRow>
                                <ProfileRow label="电话号码">
                                     {isEditing ? (
                                        <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="form-input" />
                                    ) : (
                                        <span className="text-gray-800">{formData.phone}</span>
                                    )}
                                </ProfileRow>
                                <ProfileRow label="所属部门">
                                    <span className="form-input bg-gray-100 text-gray-500 cursor-not-allowed">{user.dept?.deptName || 'N/A'}</span>
                                </ProfileRow>
                                <ProfileRow label="角色">
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map(role => (
                                            <span key={role.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full cursor-not-allowed">{role.name}</span>
                                        ))}
                                    </div>
                                </ProfileRow>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end">
                                {isEditing ? (
                                    <div className="space-x-3">
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
                                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">保存更改</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">编辑</button>
                                )}
                            </div>
                        </div>

                         {/* Security Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-left">安全设置</h2>
                                <p className="text-sm text-gray-500 mt-1 text-left">管理您的账户密码。</p>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">密码</p>
                                    <p className="text-sm text-gray-500 mt-1">******</p>
                                </div>
                                <button onClick={() => setIsPasswordModalOpen(true)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">更改密码</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
        </div>
    );
};

const ProfileRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center">
        <p className="w-1/3 text-sm font-medium text-gray-600">{label}</p>
        <div className="w-2/3">
            {children}
        </div>
    </div>
);

const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const showToast = useToast();

    const handlePasswordChange = async () => {
        setError('');
        if (!password || !confirmPassword) {
            setError('密码不能为空');
            return;
        }
        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        if (password.length < 6) {
            setError('密码长度不能少于6位');
            return;
        }

        try {
            const result = await userApi.updateUserBasic({ password });
            if (result.statusCode === 200) {
                showToast('密码更新成功', 'success');
                onClose(); // Close modal on success
            } else {
                throw new Error(result.message || '更新密码失败');
            }
        } catch (apiError) {
            const errorMessage = apiError instanceof Error ? apiError.message : '未知错误';
            setError(errorMessage);
            showToast(`错误: ${errorMessage}`, 'error');
        }
    };

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">更改密码</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">新密码</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">确认新密码</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">取消</button>
                    <button onClick={handlePasswordChange} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">确认更改</button>
                </div>
            </div>
        </div>
    );
};


export default UserProfile;
