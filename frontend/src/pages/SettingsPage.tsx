import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Save } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import { updateProfile } from '../api/friends';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ username, bio });
      toast('Profile updated!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <PageContainer>
      <div className="py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-xl font-bold text-stone-800">Settings</h1>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden border-4 border-white shadow-md">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl font-bold">
                {(user.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Email
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-border)] text-sm bg-stone-50 text-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your cooking..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none bg-white"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="border-t border-[var(--color-warm-border)] pt-5 mt-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
