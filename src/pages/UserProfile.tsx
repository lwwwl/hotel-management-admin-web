import React, { useState, useEffect } from 'react';
import { useAppContext } from '../components/AppContext';
import { userApi } from '../api';
import { useToast } from '../components/ToastProvider';
import { User, Mail, Phone, Save, Building, Shield, Edit2, X } from 'lucide-react';

// --- Helper Components ---

// UserAvatar Component
const UserAvatar = ({ displayName, size = 'large' }: { displayName: string, size?: 'small' | 'large' | 'xlarge' }) => {
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const sizeClasses = {
        small: 'w-10 h-10 text-lg',
        large: 'w-20 h-20 text-3xl',
        xlarge: 'w-24 h-24 text-4xl'
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
            className={`rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${sizeClasses[size]}`}
            style={{ backgroundColor: getColor(displayName || '') }}
        >
            {firstLetter}
        </div>
    );
};

// ProfileHeader Component
const ProfileHeader = ({ user, roles, onEditToggle }: { user: any, roles: any[], onEditToggle: () => void }) => (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <UserAvatar displayName={user.displayName} size="xlarge" />
        <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{user.displayName}</h1>
            <p className="text-gray-500">{user.username}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                {roles.map(role => (
                    <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center">
                        <Shield size={12} className="mr-1.5" />
                        {role.name}
                    </span>
                ))}
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full flex items-center">
                    <Building size={12} className="mr-1.5" />
                    {user.dept?.deptName || 'N/A'}
                </span>
            </div>
        </div>
        <button onClick={onEditToggle} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2 transition-colors">
            <Edit2 size={16} />
            <span>编辑资料</span>
        </button>
    </div>
);

// InfoCard Component
const InfoCard = ({ isEditing, formData, handleInputChange, onSave, onCancel }: { isEditing: boolean, formData: any, handleInputChange: any, onSave: () => void, onCancel: () => void }) => (
    <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">个人信息</h2>
            <p className="text-sm text-gray-500 mt-1">管理你的联系方式和个人资料。</p>
        </div>
        <div className="p-6 space-y-6">
            <InfoRow icon={User} label="显示名称" isEditing={isEditing} name="displayName" value={formData.displayName} onChange={handleInputChange} />
            <InfoRow icon={Mail} label="邮箱地址" isEditing={isEditing} name="email" type="email" value={formData.email} onChange={handleInputChange} />
            <InfoRow icon={Phone} label="电话号码" isEditing={isEditing} name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
        </div>
        {isEditing && (
            <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <X size={16} />
                    <span>取消</span>
                </button>
                <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2">
                    <Save size={16} />
                    <span>保存更改</span>
                </button>
            </div>
        )}
    </div>
);

// InfoRow Component (Sub-component for InfoCard)
const InfoRow = ({ icon: Icon, label, isEditing, name, value, onChange, type = 'text' }: { icon: React.ElementType, label: string, isEditing: boolean, name: string, value: string, onChange: any, type?: string }) => (
    <div className="flex items-center">
        <div className="w-1/3 flex items-center text-sm font-medium text-gray-600">
            <Icon className="w-5 h-5 mr-3 text-gray-400" />
            <span>{label}</span>
        </div>
        <div className="w-2/3">
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
            ) : (
                <span className="text-gray-800 font-medium">{value || '-'}</span>
            )}
        </div>
    </div>
);


// SecurityCard Component
const SecurityCard = ({ onPasswordChangeClick }: { onPasswordChangeClick: () => void }) => (
    <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">安全设置</h2>
            <p className="text-sm text-gray-500 mt-1">管理你的账户安全选项。</p>
        </div>
        <div className="p-6 flex items-center justify-between">
            <div>
                <p className="font-medium text-gray-800">账户密码</p>
                <p className="text-sm text-gray-500 mt-1">定期更换密码以保证账户安全</p>
            </div>
            <button onClick={onPasswordChangeClick} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                更改密码
            </button>
        </div>
    </div>
);

// --- Main UserProfile Component ---

const UserProfile = () => {
    const { userInfo, loading } = useAppContext();
    const { showSuccess, showError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ displayName: '', phone: '', email: '' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
    
    const handleCancel = () => {
        // Reset form data to original state
        if (userInfo?.user) {
            setFormData({
                displayName: userInfo.user.displayName,
                phone: userInfo.user.phone || '',
                email: userInfo.user.email || '',
            });
        }
        setIsEditing(false);
    }

    const handleSave = async () => {
        try {
            const result = await userApi.updateUserBasic({
                displayName: formData.displayName,
                phone: formData.phone,
                email: formData.email,
            });
            if (result.statusCode === 200) {
                showSuccess('用户信息更新成功');
                setIsEditing(false);
                // TODO: Refetch user info from context or update it directly
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    if (loading || !userInfo) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { user, roles } = userInfo;

    return (
        <div className="h-full overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8 text-left">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <ProfileHeader user={user} roles={roles} onEditToggle={() => setIsEditing(true)} />
                
                {/* Personal Information */}
                <InfoCard 
                    isEditing={isEditing}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />

                {/* Security Settings */}
                <SecurityCard onPasswordChangeClick={() => setIsPasswordModalOpen(true)} />
            </div>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
        </div>
    );
};


const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { showSuccess, showError } = useToast();

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
                showSuccess('密码更新成功');
                onClose();
            } else {
                throw new Error(result.message || '更新密码失败');
            }
        } catch (apiError) {
            const errorMessage = apiError instanceof Error ? apiError.message : '未知错误';
            setError(errorMessage);
            showError(`错误: ${errorMessage}`);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">更改密码</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">取消</button>
                    <button onClick={handlePasswordChange} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">确认更改</button>
                </div>
            </div>
        </div>
    );
};


export default UserProfile;
