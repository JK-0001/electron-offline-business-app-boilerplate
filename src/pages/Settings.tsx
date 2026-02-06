import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Download, FolderOpen, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { BackupInfo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function Settings() {
  const { user, logout } = useAuth();
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [isLoadingBackup, setIsLoadingBackup] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load backup info
  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const info = await window.electronAPI.backup.getInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  };

  const handleManualBackup = async () => {
    setIsLoadingBackup(true);
    try {
      const result = await window.electronAPI.backup.createManual();

      if (result.success) {
        toast.success(result.message);
        loadBackupInfo();
      } else {
        if (result.message !== 'Backup cancelled') {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setIsLoadingBackup(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      const result = await window.electronAPI.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.success) {
        toast.success('Password changed successfully. Please login again.');
        reset();
        // Logout after password change
        await logout();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const formatLastBackup = (timestamp: number | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Less than an hour ago';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="flex items-center gap-2">
              <Input value={user?.username || ''} disabled className="max-w-sm" />
            </div>
          </div>

          <Separator />

          {/* Change Password */}
          <div>
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>Manage your data backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Backups are automatically created every 6 hours and when you close the application.
              You can also create a manual backup at any time.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Last Backup</Label>
              <p className="font-medium">{formatLastBackup(backupInfo?.lastBackupTime || null)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Total Backups</Label>
              <p className="font-medium">{backupInfo?.backupCount || 0} files</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Backup Location</Label>
              <p className="font-medium text-sm truncate" title={backupInfo?.backupDir}>
                {backupInfo?.backupDir || 'Loading...'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button onClick={handleManualBackup} disabled={isLoadingBackup}>
              <Download className="h-4 w-4 mr-2" />
              {isLoadingBackup ? 'Creating Backup...' : 'Create Manual Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-sm">Application</dt>
              <dd className="font-medium">My Business App</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-sm">Version</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-sm">Built with</dt>
              <dd className="font-medium">Electron + React + SQLite</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-sm">Template</dt>
              <dd className="font-medium">electron-offline-template</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
